'use client';

import { Header } from '@/components/layout/Header';
import { NewProductStepper } from '@/components/stepper/NewProductStepper';

export default function NewProjectPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 md:p-8">
        <NewProductStepper />
      </main>
    </div>
  );
}
