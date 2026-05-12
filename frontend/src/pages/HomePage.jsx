import { useState } from 'react';
import CurrencyHero from '../components/CurrencyHero';
import TableNavBar from '../components/TableNavBar';
import ExchangeTable from '../components/ExchangeTable';

export default function HomePage() {
  const [selectedId, setSelectedId] = useState('USD');

  return (
    <>
      <CurrencyHero selectedId={selectedId} onSelect={setSelectedId} />
      <TableNavBar />
      <ExchangeTable selectedId={selectedId} onSelect={setSelectedId} />
    </>
  );
}
