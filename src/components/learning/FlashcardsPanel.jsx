export default function FlashcardsPanel({ visibleCards, cardIdx, cardOrder, cardRatings, setCardIdx, setFlipped, flipped, activeCard, activeCardIdx, rateCard, advanceCard, notice = "" }) {
  return (
        <div className="max-w-3xl mx-auto space-y-6">
          {notice && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{notice}</div>}
          {visibleCards.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600">No validated flashcards were returned. Check the configured AI model, then generate again.</div> : cardIdx >= cardOrder.length ? <div className="rounded-2xl border border-primary-100 bg-white p-10 text-center shadow-sm">
            <p className="text-4xl">🎉</p>
            <h2 className="mt-3 text-2xl font-black text-slate-900">Deck reviewed</h2>
            <p className="mt-2 text-slate-600">You marked {Object.keys(cardRatings).length} of {visibleCards.length} cards. Cards marked Again were shown once more.</p>
            <button onClick={() => { setCardIdx(0); setFlipped(false); }} className="mt-6 rounded-xl bg-primary-600 px-6 py-3 font-bold text-white hover:bg-primary-700">Review deck again</button>
          </div> : <>
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">Card {cardIdx + 1} of {cardOrder.length}</p>
            <div className="mt-3 h-2 w-full max-w-md mx-auto bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all" style={{ width: `${((cardIdx + 1) / cardOrder.length) * 100}%` }} />
            </div>
          </div>

          <div onClick={() => setFlipped((value) => !value)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setFlipped((value) => !value); } }} role="button" tabIndex={0} aria-label={flipped ? "Show flashcard question" : "Reveal flashcard answer"} className="relative h-80 cursor-pointer group" style={{ perspective: "1500px" }}>
            <div className="absolute inset-0 transition-transform duration-700" style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
              <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 p-6 text-white shadow-2xl shadow-primary-500/40 sm:p-8" style={{ backfaceVisibility: "hidden" }}>
                <span className="text-xs font-black uppercase tracking-widest opacity-75 mb-4">Question</span>
                <div className="max-h-44 w-full max-w-lg overflow-y-auto px-2">
                  <h3 className="break-words text-center text-lg font-black leading-snug sm:text-2xl">{activeCard.front}</h3>
                </div>
                <p className="mt-8 text-sm opacity-75">Click to reveal answer →</p>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-primary-200 bg-white p-6 shadow-2xl sm:p-8" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                <span className="text-xs font-black uppercase tracking-widest text-primary-500 mb-4">Answer</span>
                <div className="max-h-44 w-full max-w-lg overflow-y-auto px-2">
                  <h3 className="break-words text-center text-base font-semibold leading-relaxed text-slate-800 sm:text-lg">{activeCard.back}</h3>
                </div>
                {(activeCard.section || activeCard.page) && <p className="mt-3 text-xs text-slate-500">Source{activeCard.section ? ` · ${activeCard.section}` : ""}{activeCard.page ? ` · page ${activeCard.page}` : ""}</p>}
                <p className="mt-8 text-xs text-slate-400">← Click to flip back</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button onClick={e => { e.stopPropagation(); setFlipped(false); setCardIdx(i => Math.max(0, i - 1)); }} disabled={cardIdx === 0} className="px-6 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 disabled:opacity-40 transition flex items-center gap-2">
              ← Previous
            </button>
            <button type="button" onClick={() => rateCard("again")} disabled={!flipped} title={!flipped ? "Reveal the answer before rating this card" : "Show this card again once"} aria-pressed={cardRatings[activeCardIdx] === "again"} className="min-h-11 rounded-xl border border-error-100 bg-error-50 px-5 py-3 font-bold text-error-700 transition hover:bg-error-100 disabled:cursor-not-allowed disabled:opacity-50">
              ❌ Again
            </button>
            <button type="button" onClick={() => rateCard("hard")} disabled={!flipped} title={!flipped ? "Reveal the answer before rating this card" : "Mark this card as difficult and continue"} aria-pressed={cardRatings[activeCardIdx] === "hard"} className="min-h-11 rounded-xl border border-warning-100 bg-warning-50 px-5 py-3 font-bold text-warning-700 transition hover:bg-warning-100 disabled:cursor-not-allowed disabled:opacity-50">
              🟡 Hard
            </button>
            <button type="button" onClick={() => rateCard("got-it")} disabled={!flipped} title={!flipped ? "Reveal the answer before rating this card" : "Mark this card as mastered and continue"} aria-pressed={cardRatings[activeCardIdx] === "got-it"} className="min-h-11 rounded-xl border border-primary-100 bg-primary-50 px-5 py-3 font-bold text-primary-700 transition hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-50">
              ✅ Got It
            </button>
            <button onClick={advanceCard} disabled={cardIdx === cardOrder.length - 1} className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-bold shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 disabled:opacity-40 transition flex items-center gap-2">
              Next →
            </button>
          </div>
          </>}
        </div>
  );
}
