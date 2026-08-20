import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'presentation/chat/chat_screen.dart';
import 'presentation/theme/app_theme.dart';

void main() {
  runApp(const ProviderScope(child: ClinicalEvidenceApp()));
}

class ClinicalEvidenceApp extends StatelessWidget {
  const ClinicalEvidenceApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Clinical Evidence Assistant',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark(),
      home: const ChatScreen(),
    );
  }
}
