import { InMemoryGraphStore } from '../../src/core/store/inmemory-graph-store';
import { IngestionEngine, MarkdownConnector, MemoryProvenanceStore } from '../../src/core/ingestion';

const main = async () => {
  const store = new InMemoryGraphStore();
  const provenance = new MemoryProvenanceStore();
  const engine = new IngestionEngine(store, provenance);

  const connector = new MarkdownConnector({ path: './docs' });
  const records = await connector.listRecords({ limit: 50 });

  const result = await engine.ingest(records, {
    source: { type: connector.type, name: 'docs', config: { path: './docs' } },
  });

  // eslint-disable-next-line no-console
  console.log(result);
};

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});

