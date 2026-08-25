// `next/link` o'rnini bosuvchi komponent: `href` propini react-router'ning `to`
// propiga o'giradi, shunda mavjud <Link href="/leads"> kodini tahrirlash kerak
// bo'lmaydi. Tashqi manzillar, `mailto:`/`tel:` va sahifa ichidagi `#lang'a`
// havolalar oddiy <a> bo'lib qoladi — landing sahifasidagi navigatsiya shunga tayanadi.
import { Link as RouterLink } from "react-router-dom";

const EXTERNAL = /^(https?:|mailto:|tel:|#)/;

export default function Link({
  href,
  to,
  children,
  replace,
  // Next'ga xos, react-router bilmaydigan proplar — DOM'ga o'tkazmaymiz.
  prefetch: _prefetch,
  scroll: _scroll,
  shallow: _shallow,
  ...props
}) {
  const target = to ?? href ?? "#";

  if (typeof target !== "string" || EXTERNAL.test(target)) {
    return (
      <a href={target} {...props}>
        {children}
      </a>
    );
  }

  return (
    <RouterLink to={target} replace={replace} {...props}>
      {children}
    </RouterLink>
  );
}
