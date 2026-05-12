import { useState } from 'react';
import CurrencyHero from '../components/CurrencyHero';
import TableNavBar from '../components/TableNavBar';
import ForexTable from '../components/ForexTable';
import CurrencyConverter from '../components/CurrencyConverter';

export default function ForexPage() {
  const [selectedId, setSelectedId] = useState('USD');

  return (
    <>
      <CurrencyHero selectedId={selectedId} onSelect={setSelectedId} />
      <TableNavBar />
      <section className="table-section">
        <div className="table-layout">
          <ForexTable />
          <CurrencyConverter />
        </div>
      </section>
    </>
  );
}
