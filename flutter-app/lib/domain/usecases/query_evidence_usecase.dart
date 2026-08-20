import '../../core/result.dart';
import '../entities/evidence_answer.dart';
import '../repositories/evidence_repository.dart';

class QueryEvidenceUseCase {
  const QueryEvidenceUseCase(this._repository);

  final EvidenceRepository _repository;

  Future<Result<EvidenceAnswer>> call(String query, {Object? cancelToken}) {
    return _repository.queryEvidence(query, cancelToken: cancelToken);
  }
}
