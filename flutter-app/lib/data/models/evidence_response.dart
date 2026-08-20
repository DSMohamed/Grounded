import '../../core/result.dart';
import '../../domain/entities/evidence_answer.dart';

class EvidenceResponse extends EvidenceAnswer {
  const EvidenceResponse({
    required super.status,
    required super.confidence,
    super.recommendation,
    super.exactExcerpt,
    super.citation,
    super.refusalMessage,
    super.refusalReason,
  });

  static Result<EvidenceResponse> fromJson(Map<String, dynamic> json) {
    final rawStatus = json['status'];
    final rawConfidence = json['confidence'];

    final status = _parseStatus(rawStatus, json);
    if (status == null) {
      return const FailureResult(ParsingFailure('Invalid status.'));
    }

    final confidence = _parseConfidence(rawConfidence, json, status);
    if (confidence == null || confidence < 0 || confidence > 1) {
      return const FailureResult(ParsingFailure('Confidence must be between 0 and 1.'));
    }

    final recommendation = _nullableString(json['recommendation']);
    final exactExcerpt = _parseExcerpt(json);
    final refusalMessage = _parseRefusalMessage(json);
    final refusalReason = _parseReason(json);
    final citation = _parseCitation(json);

    if (status == EvidenceStatus.grounded) {
      if (recommendation == null || exactExcerpt == null || citation == null) {
        return const FailureResult(
          ParsingFailure('Grounded answers require recommendation, excerpt, and citation.'),
        );
      }
      return Success(EvidenceResponse(
        status: status,
        confidence: confidence,
        recommendation: recommendation,
        exactExcerpt: exactExcerpt,
        citation: citation,
        refusalMessage: refusalMessage,
        refusalReason: refusalReason,
      ));
    }

    return Success(EvidenceResponse(
      status: status,
      confidence: confidence,
      recommendation: recommendation,
      exactExcerpt: exactExcerpt,
      citation: citation,
      refusalMessage: refusalMessage ?? 'I could not answer from the available evidence.',
      refusalReason: refusalReason,
    ));
  }

  Map<String, dynamic> toJson() => {
        'status': status == EvidenceStatus.grounded ? 'GROUNDED' : 'REFUSED',
        'confidence': confidence,
        'recommendation': recommendation,
        'exact_excerpt': exactExcerpt,
        'citation': citation == null
            ? null
            : {
                'document': citation?.document,
                'section': citation?.section,
                'page': citation?.page,
              },
        'refusal_message': refusalMessage,
        'refusal_reason': switch (refusalReason) {
          RefusalReason.outOfScope => 'OUT_OF_SCOPE',
          RefusalReason.lowConfidence => 'LOW_CONFIDENCE',
          RefusalReason.noContext => 'NO_CONTEXT',
          RefusalReason.unknown => null,
          null => null,
        },
      };

  static EvidenceStatus? _parseStatus(Object? rawStatus, Map<String, dynamic> json) {
    if (rawStatus is! String) return null;
    final normalized = rawStatus.toUpperCase();

    if (normalized == 'GROUNDED' || normalized == 'ANSWERED') {
      return EvidenceStatus.grounded;
    }
    if (normalized == 'REFUSED' ||
        normalized.contains('REFUSAL') ||
        normalized.contains('INSUFFICIENT')) {
      return EvidenceStatus.refused;
    }

    final supportingEvidence = json['supporting_evidence'];
    if (supportingEvidence is List && supportingEvidence.isNotEmpty) {
      return EvidenceStatus.grounded;
    }

    return EvidenceStatus.refused;
  }

  static double? _parseConfidence(
    Object? rawConfidence,
    Map<String, dynamic> json,
    EvidenceStatus status,
  ) {
    if (rawConfidence is num) {
      return rawConfidence.toDouble().clamp(0.0, 1.0);
    }
    if (rawConfidence is String) {
      final parsed = double.tryParse(rawConfidence);
      if (parsed != null) return parsed.clamp(0.0, 1.0);

      final lower = rawConfidence.toLowerCase();
      if (lower == 'high') return 0.90;
      if (lower == 'medium') return 0.75;
      if (lower == 'low') return 0.40;
      if (lower.contains('insufficient') || lower == 'n/a') return 0.0;
    }

    final topScore = json['top_score'];
    if (topScore is num) {
      return topScore.toDouble().clamp(0.0, 1.0);
    }

    return status == EvidenceStatus.grounded ? 0.85 : 0.0;
  }

  static String? _nullableString(Object? value) =>
      value == null ? null : (value is String ? value : value.toString());

  static String? _parseExcerpt(Map<String, dynamic> json) {
    final direct = _nullableString(json['exact_excerpt']);
    if (direct != null && direct.isNotEmpty) return direct;

    final supporting = json['supporting_evidence'];
    if (supporting is List && supporting.isNotEmpty) {
      final first = supporting.first;
      if (first is Map<String, dynamic>) {
        final passage = _nullableString(first['passage']);
        if (passage != null && passage.isNotEmpty) return passage;
        final claim = _nullableString(first['claim']);
        if (claim != null && claim.isNotEmpty) return claim;
      }
    }

    final chunks = json['retrieved_chunks'];
    if (chunks is List && chunks.isNotEmpty) {
      final first = chunks.first;
      if (first is Map<String, dynamic>) {
        return _nullableString(first['text']);
      }
    }

    return null;
  }

  static Citation? _parseCitation(Map<String, dynamic> json) {
    final direct = json['citation'];
    final directParsed = _extractCitationObject(direct);
    if (directParsed != null) return directParsed;

    final supporting = json['supporting_evidence'];
    if (supporting is List && supporting.isNotEmpty) {
      final first = supporting.first;
      if (first is Map<String, dynamic>) {
        final fromSupporting = _extractCitationObject(first['citation']);
        if (fromSupporting != null) return fromSupporting;
      }
    }

    final chunks = json['retrieved_chunks'];
    if (chunks is List && chunks.isNotEmpty) {
      final first = chunks.first;
      if (first is Map<String, dynamic>) {
        return _extractCitationObject(first);
      }
    }

    return null;
  }

  static Citation? _extractCitationObject(Object? value) {
    if (value is! Map<String, dynamic>) return null;
    final document = _nullableString(value['document']);
    final section = _nullableString(value['section']);
    final page = value['page'];

    final parsedPage = page is int ? page : (page is num ? page.toInt() : (int.tryParse('$page') ?? 1));

    if (document != null && section != null) {
      return Citation(document: document, section: section, page: parsedPage);
    }
    return null;
  }

  static String? _parseRefusalMessage(Map<String, dynamic> json) {
    return _nullableString(json['refusal_message']) ??
        _nullableString(json['missing_information']) ??
        _nullableString(json['safety_note']);
  }

  static RefusalReason? _parseReason(Map<String, dynamic> json) {
    final rawReason = json['refusal_reason'];
    if (rawReason is String) {
      switch (rawReason) {
        case 'OUT_OF_SCOPE':
          return RefusalReason.outOfScope;
        case 'LOW_CONFIDENCE':
          return RefusalReason.lowConfidence;
        case 'NO_CONTEXT':
          return RefusalReason.noContext;
        default:
          break;
      }
    }

    final decisionPath = _nullableString(json['decision_path']);
    if (decisionPath != null) {
      if (decisionPath.contains('safety')) return RefusalReason.outOfScope;
      if (decisionPath.contains('weak') || decisionPath.contains('no_context')) {
        return RefusalReason.noContext;
      }
    }

    final status = _nullableString(json['status'])?.toUpperCase() ?? '';
    if (status.contains('SAFETY')) return RefusalReason.outOfScope;
    if (status.contains('INSUFFICIENT')) return RefusalReason.noContext;

    return null;
  }
}
