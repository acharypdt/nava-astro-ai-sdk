import 'dart:convert';
import 'package:http/http.dart' as http;

/// A client for the NavaAstro API.
class NavaAstroClient {
  final String baseUrl;

  /// Creates a new instance of [NavaAstroClient].
  /// [baseUrl] defaults to `http://localhost:3000`. Replace with your actual deployed URL.
  NavaAstroClient({this.baseUrl = 'http://localhost:3000'});

  /// Analyzes a birth chart and gets astrological insights.
  Future<Map<String, dynamic>> analyzeChart({
    required int year,
    required int month,
    required int day,
    required int hour,
    required int minute,
    required double latitude,
    required double longitude,
    required double timezoneOffset,
    String? location,
  }) async {
    final uri = Uri.parse('$baseUrl/api/astro-engine');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'year': year,
        'month': month,
        'day': day,
        'hour': hour,
        'minute': minute,
        'latitude': latitude,
        'longitude': longitude,
        'timezone_offset': timezoneOffset,
        'location': location,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        'Failed to analyze chart: ${response.statusCode} - ${response.body}',
      );
    }
  }

  /// Finds Muhurtas (auspicious times) based on birth data and options.
  Future<Map<String, dynamic>> findMuhurta({
    required Map<String, dynamic> birthData,
    required Map<String, dynamic> options,
  }) async {
    final uri = Uri.parse('$baseUrl/api/astro-engine/muhurta');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'birth_data': birthData, 'options': options}),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception(
        'Failed to find Muhurta: ${response.statusCode} - ${response.body}',
      );
    }
  }
}
