import 'package:flutter_test/flutter_test.dart';

import 'package:nava_astro_flutter/nava_astro_flutter.dart';

void main() {
  test('NavaAstroClient can be instantiated', () {
    final client = NavaAstroClient(baseUrl: 'http://localhost:3000');
    expect(client.baseUrl, 'http://localhost:3000');
  });
}
