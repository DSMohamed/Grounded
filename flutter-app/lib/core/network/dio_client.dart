import 'package:dio/dio.dart';

class DioClient {
  DioClient(String baseUrl)
      : dio = Dio(
          BaseOptions(
            baseUrl: baseUrl,
            connectTimeout: const Duration(seconds: 30),
            receiveTimeout: const Duration(seconds: 60),
            headers: const {
              'Content-Type': 'application/json',
              'ngrok-skip-browser-warning': 'true',
            },
          ),
        );

  final Dio dio;
}
