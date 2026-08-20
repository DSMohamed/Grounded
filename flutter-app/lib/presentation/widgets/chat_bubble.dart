import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class ChatBubble extends StatelessWidget {
  const ChatBubble({super.key, required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerRight,
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 520),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.primary.withValues(alpha: 0.22),
            borderRadius: BorderRadius.circular(18),
          ),
          child: Padding(padding: const EdgeInsets.all(14), child: Text(text)),
        ),
      ),
    ).animate().fadeIn(duration: 160.ms).slideX(begin: 0.03, end: 0, duration: 160.ms);
  }
}
