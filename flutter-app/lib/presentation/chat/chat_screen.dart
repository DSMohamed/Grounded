import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/result.dart';
import '../theme/app_theme.dart';
import '../widgets/answer_card.dart';
import '../widgets/chat_bubble.dart';
import '../widgets/refusal_card.dart';
import 'chat_notifier.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final chat = ref.watch(chatNotifierProvider);
    final messages = chat.valueOrNull?.messages ?? const <ChatMessage>[];
    return Scaffold(
      appBar: AppBar(title: const Text('Clinical Evidence Assistant')),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: messages.length + (chat.isLoading ? 1 : 0),
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  if (index >= messages.length) return const _SkeletonCard();
                  return _MessageView(message: messages[index], onRetry: () => ref.read(chatNotifierProvider.notifier).retry());
                },
              ),
            ),
            _Composer(
              controller: _controller,
              enabled: !chat.isLoading,
              onSend: () {
                ref.read(chatNotifierProvider.notifier).send(_controller.text);
                _controller.clear();
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _MessageView extends StatelessWidget {
  const _MessageView({required this.message, required this.onRetry});

  final ChatMessage message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final text = message.text;
    final answer = message.answer;
    final failure = message.failure;
    if (text != null) return ChatBubble(text: text);
    if (answer != null) {
      return answer.shouldRenderRefusal ? RefusalCard(answer: answer, onRetry: onRetry) : AnswerCard(answer: answer);
    }
    if (failure != null) return _FailureCard(failure: failure, onRetry: onRetry);
    return const SizedBox.shrink();
  }
}

class _Composer extends StatelessWidget {
  const _Composer({required this.controller, required this.enabled, required this.onSend});

  final TextEditingController controller;
  final bool enabled;
  final VoidCallback onSend;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: controller,
              enabled: enabled,
              minLines: 1,
              maxLines: 4,
              textInputAction: TextInputAction.send,
              decoration: const InputDecoration(hintText: 'Ask a citation-bound clinical evidence question'),
              onSubmitted: (_) => enabled ? onSend() : null,
            ),
          ),
          const SizedBox(width: 8),
          IconButton.filled(onPressed: enabled ? onSend : null, icon: const Icon(Icons.send)),
        ],
      ),
    );
  }
}

class _FailureCard extends StatelessWidget {
  const _FailureCard({required this.failure, required this.onRetry});

  final Failure failure;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final isTimeout = failure is TimeoutFailure;
    return GlassCard(
      borderColor: isTimeout ? AppColors.amber : AppColors.red,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(isTimeout ? 'Request timed out' : 'Evidence service error', style: const TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Text(failure.message),
          const SizedBox(height: 12),
          FilledButton.tonal(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}

class _SkeletonCard extends StatelessWidget {
  const _SkeletonCard();

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: List.generate(
          3,
          (index) => Container(
            margin: const EdgeInsets.symmetric(vertical: 6),
            height: 14,
            width: 220 - (index * 40),
            decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
          ),
        ),
      ),
    ).animate(onPlay: (controller) => controller.repeat()).shimmer(duration: 1200.ms, color: Colors.white24);
  }
}
