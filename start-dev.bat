@echo off
cd /d "C:\Users\Dell\hereitis\globetrotter"
set DATABASE_URL=file:./prisma/dev.db
npm run dev
