'use strict';

const ApiResponse = require('../../../src/shared/utils/ApiResponse');

describe('ApiResponse', () => {
  test('does not expose legacy numeric HTTP status as metadata', () => {
    expect(ApiResponse.success({ id: 1 }, 'Created', 201)).toEqual({
      success: true,
      message: 'Created',
      data: { id: 1 },
    });
  });

  test('preserves structured metadata', () => {
    expect(ApiResponse.success([], 'Listed', { total: 0 })).toEqual({
      success: true,
      message: 'Listed',
      data: [],
      meta: { total: 0 },
    });
  });
});
