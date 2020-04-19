import { objDiff, buildParamsFromObj } from './object';

const a = { foo: 'bar', name: 'John Doe', same: 'same' };
const b = { foo: 'baz', same: 'same' };

describe('object utils', () => {
	describe('objDiff', () => {
		it('should return empty object', () => {
			expect(objDiff()()).toEqual({});
			expect(objDiff({})({})).toEqual({});
			expect(objDiff({})(a)).toEqual(a);
		});
		it('should return differential object', () => {
			expect(objDiff(a)(b)).toEqual({ foo: 'bar', name: 'John Doe' });
			expect(objDiff(b)(a)).toEqual({ foo: 'baz' });
		});
	});
	describe('buildParamsFromObj', () => {
		it('should return empty string', () => {
			expect(buildParamsFromObj()).toEqual('');
			expect(buildParamsFromObj([])).toEqual('');
			expect(buildParamsFromObj({})).toEqual('');
		});
		it('should return filled string', () => {
			expect(buildParamsFromObj({ a: 'A', b: 'B' })).toEqual('a=A&b=B');
		});
	});
});
