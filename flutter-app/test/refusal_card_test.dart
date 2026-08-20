import 'package:clinical_evidence_assistant/domain/entities/evidence_answer.dart';
import 'package:clinical_evidence_assistant/presentation/widgets/refusal_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('refusal card renders on REFUSED answer', (tester) async {
    const answer = EvidenceAnswer(
      status: EvidenceStatus.refused,
      confidence: 0.2,
      refusalMessage: 'No supporting context was retrieved.',
      refusalReason: RefusalReason.noContext,
    );

    await tester.pumpWidget(const MaterialApp(home: Scaffold(body: RefusalCard(answer: answer))));
    await tester.pumpAndSettle();

    expect(find.text('Unable to answer safely'), findsOneWidget);
    expect(find.text('No supporting context was retrieved.'), findsOneWidget);
    expect(find.text('Retry / rephrase'), findsOneWidget);
  });
}
