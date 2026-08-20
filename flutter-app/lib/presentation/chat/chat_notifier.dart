import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/env.dart';
import '../../core/network/dio_client.dart';
import '../../core/result.dart';
import '../../data/repositories/evidence_repository_impl.dart';
import '../../domain/entities/evidence_answer.dart';
import '../../domain/usecases/query_evidence_usecase.dart';

final queryEvidenceUseCaseProvider = Provider<QueryEvidenceUseCase>((ref) {
  final dio = DioClient(Env.apiBaseUrl).dio;
  return QueryEvidenceUseCase(EvidenceRepositoryImpl(dio));
});

final chatNotifierProvider = AsyncNotifierProvider<ChatNotifier, ChatState>(ChatNotifier.new);

enum ChatMessageRole { user, assistant }

class ChatMessage {
  const ChatMessage.user(this.text)
      : answer = null,
        failure = null,
        role = ChatMessageRole.user;

  const ChatMessage.answer(this.answer)
      : text = null,
        failure = null,
        role = ChatMessageRole.assistant;

  const ChatMessage.failure(this.failure)
      : text = null,
        answer = null,
        role = ChatMessageRole.assistant;

  final ChatMessageRole role;
  final String? text;
  final EvidenceAnswer? answer;
  final Failure? failure;
}

class ChatState {
  const ChatState({this.messages = const [], this.lastQuery});

  final List<ChatMessage> messages;
  final String? lastQuery;

  ChatState copyWith({List<ChatMessage>? messages, String? lastQuery}) {
    return ChatState(messages: messages ?? this.messages, lastQuery: lastQuery ?? this.lastQuery);
  }
}

class ChatNotifier extends AsyncNotifier<ChatState> {
  CancelToken? _cancelToken;

  @override
  Future<ChatState> build() async => const ChatState();

  Future<void> send(String query) async {
    final trimmed = query.trim();
    if (trimmed.isEmpty) return;

    _cancelToken?.cancel('Superseded by a new query.');
    _cancelToken = CancelToken();
    final activeToken = _cancelToken;

    final current = state.valueOrNull ?? const ChatState();
    final pending = current.copyWith(
      lastQuery: trimmed,
      messages: [...current.messages, ChatMessage.user(trimmed)],
    );
    state = const AsyncLoading<ChatState>();

    if (Env.apiBaseUrl.isEmpty) {
      state = AsyncData(pending.copyWith(
        messages: [...pending.messages, const ChatMessage.failure(ConfigurationFailure())],
      ));
      return;
    }

    final result = await ref.read(queryEvidenceUseCaseProvider)(trimmed, cancelToken: activeToken);
    if (_cancelToken != activeToken) return;
    state = AsyncData(result.when(
      success: (answer) => pending.copyWith(messages: [...pending.messages, ChatMessage.answer(answer)]),
      failure: (failure) => pending.copyWith(messages: [...pending.messages, ChatMessage.failure(failure)]),
    ));
  }

  Future<void> retry() async {
    final query = state.valueOrNull?.lastQuery;
    if (query != null) await send(query);
  }
}
