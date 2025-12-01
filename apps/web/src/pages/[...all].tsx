import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Frown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-vrclo1-50  p-6">
      <Card className="p-10 text-center space-y-6 max-w-lg shadow-xl">
        <Frown className="w-16 h-16 mx-auto text-red-500" />
        <h1 className="text-5xl font-extrabold text-vrclo1-900 ">
            404
        </h1>
        <h2 className="text-2xl font-semibold">
            {t('not_found.page_not_found')}
        </h2>
        <p className="text-vrclo1-500 ">
            {t('not_found.page_not_found_description')}
        </p>
        <Link to="/">
          <Button className='mt-6'>{t('not_found.go_home')}</Button>
        </Link>
      </Card>
    </div>
  );
}