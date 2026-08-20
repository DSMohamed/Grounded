import '../../core/result.dart';
import '../entities/evidence_answer.dart';

abstract interface class EvidenceRepository {
  Future<Result<EvidenceAnswer>> queryEvidence(String query, {Object? cancelToken});
}
