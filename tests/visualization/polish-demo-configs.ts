export const polishDemoConfigs = [
  {
    name: 'idle-normal',
    query: '?count=120&perf=normal&effects=1&density=balanced&cards=hover',
  },
  {
    name: 'hover-cards',
    query: '?count=120&perf=normal&cards=hover',
  },
  {
    name: 'click-focus',
    query: '?count=120&perf=normal&cards=click',
  },
  {
    name: 'density-relaxed',
    query: '?count=180&perf=normal&density=relaxed',
  },
  {
    name: 'density-balanced',
    query: '?count=180&perf=normal&density=balanced',
  },
  {
    name: 'density-compact',
    query: '?count=180&perf=normal&density=compact',
  },
  {
    name: 'degraded-mode',
    query: '?count=240&perf=degraded&density=compact&cards=hover',
  },
  {
    name: 'fallback-mode',
    query: '?count=500&perf=fallback&effects=0&cards=none',
  },
];
