import React from 'react';
import { Outlet, useMatch } from 'react-router-dom';
import Header from './layout/Header';

export default function Layout() {
  const isDialoguePage = useMatch('/practice/:categoryId/:dialogueId');
  const isDialoguesPage = useMatch('/dialogues');

  return (
    <div className="min-h-screen bg-gray-50">
      {!isDialoguePage && !isDialoguesPage && <Header />}
      <main className={!isDialoguePage ? 'pt-14' : ''}>
        <Outlet />
      </main>
    </div>
  );
}