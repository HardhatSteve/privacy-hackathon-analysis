import {
  cn,
  formatAddress,
  formatDate,
  formatRelativeTime,
  getScoreColor,
  getScoreGrade,
  getSeverityWeight,
  generateId,
  debounce,
  throttle,
} from '../utils';

describe('cn utility', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should merge conflicting Tailwind classes', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2');
  });
});

describe('formatAddress', () => {
  it('should format long addresses', () => {
    const address = 'TokenSwap1111111111111111111111111111111111';
    expect(formatAddress(address)).toBe('Toke...1111');
  });

  it('should handle short addresses', () => {
    const address = 'short';
    expect(formatAddress(address)).toBe('short');
  });

  it('should respect custom length', () => {
    const address = 'TokenSwap1111111111111111111111111111111111';
    expect(formatAddress(address, 6)).toBe('TokenS...111111');
  });
});

describe('formatDate', () => {
  it('should format date strings', () => {
    const result = formatDate('2024-01-15T12:00:00Z');
    expect(result).toContain('Jan');
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('should format Date objects', () => {
    const date = new Date('2024-06-20T00:00:00Z');
    const result = formatDate(date);
    expect(result).toContain('Jun');
    expect(result).toContain('20');
  });
});

describe('formatRelativeTime', () => {
  it('should show "just now" for recent times', () => {
    const now = new Date();
    expect(formatRelativeTime(now)).toBe('just now');
  });

  it('should show minutes for times within an hour', () => {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
    expect(formatRelativeTime(thirtyMinsAgo)).toBe('30m ago');
  });

  it('should show hours for times within a day', () => {
    const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
    expect(formatRelativeTime(fiveHoursAgo)).toBe('5h ago');
  });

  it('should show days for times within a month', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeDaysAgo)).toBe('3d ago');
  });
});

describe('getScoreColor', () => {
  it('should return excellent for scores >= 80', () => {
    expect(getScoreColor(80)).toBe('score-excellent');
    expect(getScoreColor(100)).toBe('score-excellent');
  });

  it('should return good for scores >= 60', () => {
    expect(getScoreColor(60)).toBe('score-good');
    expect(getScoreColor(79)).toBe('score-good');
  });

  it('should return fair for scores >= 40', () => {
    expect(getScoreColor(40)).toBe('score-fair');
    expect(getScoreColor(59)).toBe('score-fair');
  });

  it('should return poor for scores < 40', () => {
    expect(getScoreColor(0)).toBe('score-poor');
    expect(getScoreColor(39)).toBe('score-poor');
  });
});

describe('getScoreGrade', () => {
  it('should return A+ for scores >= 95', () => {
    expect(getScoreGrade(95)).toBe('A+');
    expect(getScoreGrade(100)).toBe('A+');
  });

  it('should return F for scores < 40', () => {
    expect(getScoreGrade(0)).toBe('F');
    expect(getScoreGrade(39)).toBe('F');
  });

  it('should return correct grades for middle scores', () => {
    expect(getScoreGrade(90)).toBe('A');
    expect(getScoreGrade(75)).toBe('B');
    expect(getScoreGrade(60)).toBe('C');
    expect(getScoreGrade(45)).toBe('D');
  });
});

describe('getSeverityWeight', () => {
  it('should return correct weights', () => {
    expect(getSeverityWeight('CRITICAL')).toBe(30);
    expect(getSeverityWeight('HIGH')).toBe(20);
    expect(getSeverityWeight('MEDIUM')).toBe(10);
    expect(getSeverityWeight('LOW')).toBe(5);
  });

  it('should handle lowercase', () => {
    expect(getSeverityWeight('critical')).toBe(30);
  });

  it('should return 0 for unknown severity', () => {
    expect(getSeverityWeight('UNKNOWN')).toBe(0);
  });
});

describe('generateId', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('should generate string IDs', () => {
    const id = generateId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});

describe('debounce', () => {
  jest.useFakeTimers();

  it('should debounce function calls', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();

    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('throttle', () => {
  jest.useFakeTimers();

  it('should throttle function calls', () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);

    throttled();
    throttled();
    throttled();

    expect(fn).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100);
    throttled();

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
