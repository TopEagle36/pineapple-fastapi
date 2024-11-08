export function getFixedNumer(num, decimal, under) {
  return Number((Number(num) / 10 ** decimal).toFixed(under));
}
