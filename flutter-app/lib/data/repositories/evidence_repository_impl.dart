import 'package:dio/dio.dart';

import '../../core/result.dart';
import '../../domain/entities/evidence_answer.dart';
import '../../domain/repositories/evidence_repository.dart';
import '../models/evidence_response.dart';

class EvidenceRepositoryImpl implements EvidenceRepository {
  const EvidenceRepositoryImpl(this._dio);

  final Dio _dio;

  @override
  Future<Result<EvidenceAnswer>> queryEvidence(String query, {Object? cancelToken}) async {
    try {
      final token = cancelToken is CancelToken ? cancelToken : null;
      final payload = {
        'query': query,
        'question': query,
      };

      Response<Object> response;
      try {
        final path = _resolveEndpointPath(_dio.options.baseUrl);
        response = await _dio.post<Object>(
          path,
          data: payload,
          cancelToken: token,
        );
      } on DioException catch (e) {
        if (e.response?.statusCode == 404) {
          // If the initial path returned 404, fallback to '/ask'
          response = await _dio.post<Object>(
            '/ask',
            data: payload,
            cancelToken: token,
          );
        } else {
          rethrow;
        }
      }

      final data = response.data;
      if (data is! Map<String, dynamic>) {
        return const FailureResult(ParsingFailure('Response root must be a JSON object.'));
      }
      final parsed = EvidenceResponse.fromJson(data);
      return parsed.when<Result<EvidenceAnswer>>(
        success: (answer) => Success<EvidenceAnswer>(answer.enforceConfidenceThreshold()),
        failure: FailureResult<EvidenceAnswer>.new,
      );
    } on DioException catch (error) {
      if (CancelToken.isCancel(error)) {
        return const FailureResult(NetworkFailure('Request was cancelled.'));
      }
      if (error.type == DioExceptionType.connectionTimeout || error.type == DioExceptionType.receiveTimeout) {
        return const FailureResult(TimeoutFailure());
      }
      return const FailureResult(NetworkFailure());
    } catch (_) {
      return const FailureResult(NetworkFailure());
    }
  }

  String _resolveEndpointPath(String baseUrl) {
    final clean = baseUrl.trim().toLowerCase();
    if (clean.endsWith('/ask') || clean.endsWith('/query')) {
      return '';
    }
    return '/ask';
  }
}
