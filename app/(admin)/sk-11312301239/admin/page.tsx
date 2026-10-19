import { redirect } from 'next/navigation';
import { ADMIN_OBSCURE_PATH } from '@/features/admin';

export default function AdminRouteAliasPage() {
  redirect(ADMIN_OBSCURE_PATH);
}
