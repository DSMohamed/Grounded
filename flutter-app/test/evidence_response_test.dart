import 'package:clinical_evidence_assistant/core/result.dart';
import 'package:clinical_evidence_assistant/data/models/evidence_response.dart';
import 'package:clinical_evidence_assistant/domain/entities/evidence_answer.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('EvidenceResponse.fromJson parses valid grounded input', () {
    final result = EvidenceResponse.fromJson({
      'status': 'GROUNDED',
      'confidence': 0.91,
      'recommendation': 'Use primary-source evidence.',
      'exact_excerpt': 'The cited excerpt.',
      'citation': {'document': 'Guideline.pdf', 'section': 'A', 'page': 2},
      'refusal_message': null,
      'refusal_reason': null,
    });

    expect(result, isA<Success<EvidenceResponse>>());
    final answer = (result as Success<EvidenceResponse>).data;
    expect(answer.status, EvidenceStatus.grounded);
    expect(answer.citation?.document, 'Guideline.pdf');
  });

  test('EvidenceResponse.fromJson parses grounded-insights answered format', () {
    final result = EvidenceResponse.fromJson({
      'status': 'Answered',
      'recommendation': 'Behavioral counseling is strongly recommended.',
      'supporting_evidence': [
        {
          'claim': 'Behavioral counseling is strongly recommended.',
          'citation': {
            'document': 'USPSTF Guideline',
            'section': 'Summary',
            'page': 1,
          },
          'passage': 'Exact excerpt passage here.'
        }
      ],
      'confidence': 'High',
      'missing_information': 'None',
      'safety_note': 'Educational only',
      'risk_tier': 'Allowed',
      'decision_path': 'answered',
    });

    expect(result, isA<Success<EvidenceResponse>>());
    final answer = (result as Success<EvidenceResponse>).data;
    expect(answer.status, EvidenceStatus.grounded);
    expect(answer.confidence, greaterThanOrEqualTo(0.8));
    expect(answer.citation?.document, 'USPSTF Guideline');
    expect(answer.exactExcerpt, 'Exact excerpt passage here.');
  });

  test('EvidenceResponse.fromJson parses grounded-insights safety refusal format', () {
    final result = EvidenceResponse.fromJson({
      'status': 'Safety Refusal',
      'recommendation': 'This question is outside what this assistant will answer.',
      'supporting_evidence': [],
      'confidence': 'N/A',
      'missing_information': 'Prescribing request is out of scope.',
      'safety_note': 'Consult a licensed clinician.',
      'risk_tier': 'Refuse/Redirect',
      'decision_path': 'safety_refusal',
    });

    expect(result, isA<Success<EvidenceResponse>>());
    final answer = (result as Success<EvidenceResponse>).data;
    expect(answer.status, EvidenceStatus.refused);
    expect(answer.refusalReason, RefusalReason.outOfScope);
  });

  test('EvidenceResponse.fromJson returns ParsingFailure for malformed grounded input', () {
    final result = EvidenceResponse.fromJson({
      'status': 'GROUNDED',
      'confidence': 0.91,
      'recommendation': null,
      'exact_excerpt': 'excerpt',
      'citation': null,
    });

    expect(result, isA<FailureResult<EvidenceResponse>>());
    expect((result as FailureResult<EvidenceResponse>).failure, isA<ParsingFailure>());
  });

  test('confidence-threshold override forces refusal', () {
    const answer = EvidenceAnswer(
      status: EvidenceStatus.grounded,
      confidence: 0.4,
      recommendation: 'Recommendation',
      exactExcerpt: 'Excerpt',
      citation: Citation(document: 'doc', section: 'sec', page: 1),
    );

    final safe = answer.enforceConfidenceThreshold();

    expect(safe.status, EvidenceStatus.refused);
    expect(safe.refusalReason, RefusalReason.lowConfidence);
  });
}
