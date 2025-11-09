'use client';

import {usePathname, useRouter} from "next/navigation";
import {useLocale} from "../../i18n/client";
import {routing} from "../../i18n/routing";

export default function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const handleSwitch = (nextLocale: string) => {
    const segments = pathname.split("/").filter(Boolean);

    if (segments.length === 0) {
      router.push(`/${nextLocale}`);
      return;
    }

    segments[0] = nextLocale;
    const newPath = `/${segments.join("/")}`;
    router.push(newPath);
  };

  return (
    <div className='flex items-center gap-2 text-xs text-white/70'>
      <div className='flex overflow-hidden rounded-full border border-white/15 bg-white/10'>
        {routing.locales.map((item) => (
          <button
            key={item}
            type='button'
            onClick={() => handleSwitch(item)}
            className={`px-3 py-1 text-xs font-medium transition ${
              item === locale
                ? 'bg-white text-zinc-900'
                : 'text-white/70 hover:bg-white/10'
            }`}>
            {item.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
