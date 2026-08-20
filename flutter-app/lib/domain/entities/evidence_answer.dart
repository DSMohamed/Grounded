import 'package:equatable/equatable.dart';

const double minimumGroundedConfidence = 0.55;

enum EvidenceStatus { grounded, refused }
enum RefusalReason { outOfScope, lowConfidence, noContext, unknown }

class Citation extends Equatable {
  const Citation({required this.document, required this.section, required this.page});

  final String document;
  final String section;
  final int page;

  @override
  List<Object?> get props => [document, section, page];
}

class EvidenceAnswer extends Equatable {
  const EvidenceAnswer({
    required this.status,
    required this.confidence,
    this.recommendation,
    this.exactExcerpt,
    this.citation,
    this.refusalMessage,
    this.refusalReason,
  });

  final EvidenceStatus status;
  final double confidence;
  final String? recommendation;
  final String? exactExcerpt;
  final Citation? citation;
  final String? refusalMessage;
  final RefusalReason? refusalReason;

  bool get shouldRenderRefusal =>
      status == EvidenceStatus.refused || confidence < minimumGroundedConfidence;

  EvidenceAnswer enforceConfidenceThreshold() {
    if (status == EvidenceStatus.grounded && confidence < minimumGroundedConfidence) {
      return EvidenceAnswer(
        status: EvidenceStatus.refused,
        confidence: confidence,
        refusalMessage: 'Confidence is too low to provide a grounded answer. Please rephrase or add context.',
        refusalReason: RefusalReason.lowConfidence,
      );
    }
    return this;
  }

  @override
  List<Object?> get props => [
        status,
        confidence,
        recommendation,
        exactExcerpt,
        citation,
        refusalMessage,
        refusalReason,
      ];
}
