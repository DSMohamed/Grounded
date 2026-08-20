sealed class Result<T> {
  const Result();

  R when<R>({required R Function(T data) success, required R Function(Failure failure) failure}) {
    return switch (this) {
      Success<T>(:final data) => success(data),
      FailureResult<T>(failure: final error) => failure(error),
    };
  }
}

final class Success<T> extends Result<T> {
  const Success(this.data);
  final T data;
}

final class FailureResult<T> extends Result<T> {
  const FailureResult(this.failure);
  final Failure failure;
}

sealed class Failure {
  const Failure(this.message);
  final String message;
}

final class NetworkFailure extends Failure {
  const NetworkFailure([super.message = 'Network error. Please try again.']);
}

final class TimeoutFailure extends Failure {
  const TimeoutFailure([super.message = 'The request timed out. Please try again.']);
}

final class ParsingFailure extends Failure {
  const ParsingFailure([super.message = 'The answer could not be validated.']);
}

final class ConfigurationFailure extends Failure {
  const ConfigurationFailure([super.message = 'API_BASE_URL is not configured.']);
}
