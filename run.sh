hyperfine --min-runs 60 --warmup 20 'ts-node pipeline-ramda.ts 10' 'ts-node pipeline-iteractive.ts 10' 'ts-node pipeline-recursive.ts 10' --export-markdown benchmarks.md --export-json benchmarks.json
