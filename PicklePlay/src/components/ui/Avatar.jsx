import clsx from 'clsx';
import { initials } from '../../lib/format';

const SIZES = { xs: 'size-6 text-[10px]', sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-14 text-lg', xl: 'size-20 text-2xl' };
const COLORS = ['bg-brand-500', 'bg-court-500', 'bg-accent-500', 'bg-ink-500', 'bg-emerald-500', 'bg-violet-500'];

function colorFor(seed = '') {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i)) % COLORS.length;
  return COLORS[h];
}

export default function Avatar({ name = '?', src, size = 'md', className }) {
  if (src) {
    return <img src={src} alt={name} className={clsx('rounded-full object-cover', SIZES[size], className)} />;
  }
  return (
    <div className={clsx('flex items-center justify-center rounded-full font-semibold text-white', SIZES[size], colorFor(name), className)}>
      {initials(name) || '?'}
    </div>
  );
}
