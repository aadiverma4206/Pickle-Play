import { Construction } from 'lucide-react';
import SectionHeader from './SectionHeader';
import { EmptyState } from './States';

// Temporary scaffold placeholder — swapped for the real page during the
// build-out pass. Kept intentionally tiny.
export default function ComingSoon({ title, subtitle }) {
  return (
    <div>
      <SectionHeader title={title} subtitle={subtitle} />
      <EmptyState icon={Construction} title="Under construction" message="This section of the prototype is being built out." />
    </div>
  );
}
