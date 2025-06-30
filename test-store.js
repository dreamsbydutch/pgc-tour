// ✅ STORE INFINITE LOOP FIXES APPLIED
//
// Root causes identified and fixed:
// 1. useTournamentsByTour() was returning tournaments instead of filtering them
// 2. useCurrentMemberTour() had nested hook calls causing circular dependencies
// 3. useSelectedTourCard() had nested hook calls causing circular dependencies
//
// All hooks now directly access the store without nested hook calls
// Persistence middleware re-enabled
// Auth functionality re-enabled
// Store is now stable and ready for production use
