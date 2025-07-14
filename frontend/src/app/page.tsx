import CsvUploader from '@/components/CsvUploader';

export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-4">📊 InsightPredictor</h1>
      <CsvUploader />
    </main>
  );
}
