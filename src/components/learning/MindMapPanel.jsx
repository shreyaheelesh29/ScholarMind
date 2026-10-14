import { Link } from 'react-router-dom';

export default function MindMapPanel({ mindmapEdges, mindmapRoot, mindmapChildren, mindmapNodes, visibleMindmapNodes, selectedMindmapNode, selectedMindmapPath, selectedMindmapPathIds, isDescendantOfSelectedMindmapNode, mindmapPositions, mindmapLayoutWidth, mindmapLayoutHeight, mindmapPan, mindmapZoom, collapsedMindmapNodes, expandingMindmapNodes, mindmapError, mindmapNotice, mindmapSearch, generatedMindmap, generatedMindmapArtifactId, mindmapPrompt, mapViewportRef, mapStageRef, searchMindmap, downloadMindmap, focusMindmapNode, chooseMindmapNode, expandMindmapNode, startMindmapPan, moveMindmapPan, stopMindmapPan, setCollapsedMindmapNodes, setSelectedMindmapNodeId, setMindmapZoom, setMindmapPan, setMindmapSearch }) {
  return (
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-primary-50/30 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white p-5">
            <div>
              <h3 className="font-black text-xl text-slate-900">{generatedMindmap ? "Generated Paper Mind Map" : "Paper Mind Map"}</h3>
              <p className="text-sm text-slate-500">Select a concept to focus its branch; surrounding topics shrink while you explore. Drag to pan and use the zoom controls to navigate.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <form onSubmit={searchMindmap} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
                <input list="mindmap-concept-options" value={mindmapSearch} onChange={(event) => setMindmapSearch(event.target.value)} aria-label="Search concepts in mind map" placeholder="Find a concept…" className="w-36 rounded-md px-2 py-1.5 text-sm outline-none sm:w-48" />
                <datalist id="mindmap-concept-options">{mindmapNodes.map((node) => <option key={node.id} value={node.label} />)}</datalist>
                <button type="submit" className="rounded-md bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">Find</button>
              </form>
              <button onClick={() => setCollapsedMindmapNodes(new Set(mindmapRoot ? [mindmapRoot.id] : []))} disabled={!mindmapRoot || !(mindmapChildren[mindmapRoot.id] || []).length} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">Collapse branches</button>
              <button onClick={() => {
                if (!mindmapRoot) return;
                setSelectedMindmapNodeId(mindmapRoot.id);
                setCollapsedMindmapNodes((current) => { const next = new Set(current); next.delete(mindmapRoot.id); return next; });
                setMindmapZoom(1);
                const viewport = mapViewportRef.current;
                if (viewport) {
                  viewport.scrollTo({ top: 0, left: 0, behavior: "smooth" });
                  const rootPosition = mindmapPositions.get(mindmapRoot.id) || { x: 50, y: 50 };
                  setMindmapPan({ x: Math.max(12, viewport.clientWidth / 2 - (rootPosition.x / 100) * mindmapLayoutWidth), y: 20 - (rootPosition.y / 100) * mindmapLayoutHeight });
                } else setMindmapPan({ x: 0, y: 0 });
              }} disabled={!mindmapRoot} className="rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-100 disabled:opacity-40">Show root</button>
              <button onClick={() => setCollapsedMindmapNodes(new Set())} disabled={!collapsedMindmapNodes.size} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40">Expand all</button>
              <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1" aria-label="Mind map zoom controls">
                <button onClick={() => setMindmapZoom((value) => Math.max(0.6, Math.round((value - 0.1) * 10) / 10))} disabled={mindmapZoom <= 0.6} aria-label="Zoom out" className="h-8 w-8 rounded-md text-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40">−</button>
                <button onClick={() => { setMindmapZoom(1); setMindmapPan({ x: 0, y: 0 }); }} aria-label="Reset zoom and position" className="min-w-14 px-2 text-xs font-semibold text-slate-600">{Math.round(mindmapZoom * 100)}%</button>
                <button onClick={() => setMindmapZoom((value) => Math.min(1.6, Math.round((value + 0.1) * 10) / 10))} disabled={mindmapZoom >= 1.6} aria-label="Zoom in" className="h-8 w-8 rounded-md text-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40">+</button>
              </div>
              <button onClick={downloadMindmap} disabled={!mindmapRoot} className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-40">Download outline</button>
            </div>
          </div>
          {mindmapNodes.length === 0 && <p className="p-8 text-center text-slate-600">No validated mind map was returned. Check your configured AI model, then generate again.</p>}
          {mindmapError && <p role="alert" className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-800">{mindmapError}</p>}
          {mindmapNotice && <p role="status" className="border-b border-emerald-100 bg-emerald-50 px-5 py-3 text-sm text-emerald-800">{mindmapNotice}</p>}
          {mindmapNodes.length > 0 && <div ref={mapViewportRef} onPointerDown={startMindmapPan} onPointerMove={moveMindmapPan} onPointerUp={stopMindmapPan} onPointerCancel={stopMindmapPan} className="relative h-[min(72vh,720px)] min-h-[480px] overflow-hidden touch-none bg-[radial-gradient(#cbd5e1_0.8px,transparent_0.8px)] [background-size:20px_20px] cursor-grab active:cursor-grabbing">
          <div ref={mapStageRef} className="relative min-w-[760px] transition-transform duration-300 ease-out" style={{ width: `${mindmapLayoutWidth}px`, height: `${mindmapLayoutHeight}px`, transform: `translate(${mindmapPan.x}px, ${mindmapPan.y}px) scale(${mindmapZoom})`, transformOrigin: "0 0" }}>
            <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
              <defs>
                <marker id="mindmap-arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                </marker>
              </defs>
              {mindmapEdges.map((edge, i) => {
                const na = visibleMindmapNodes.find(n => n.id === edge.source);
                const nb = visibleMindmapNodes.find(n => n.id === edge.target);
                if (!na || !nb) return null;
                return <g key={i}>
                  <line x1={`${na.x}%`} y1={`${na.y}%`} x2={`${nb.x}%`} y2={`${nb.y}%`} stroke="#94a3b8" strokeOpacity="0.65" strokeWidth="2" markerEnd="url(#mindmap-arrow)" />
                  {edge.label && <text x={`${(na.x + nb.x) / 2}%`} y={`${(na.y + nb.y) / 2}%`} textAnchor="middle" className="fill-slate-700" fontSize="12" fontWeight="600" paintOrder="stroke" stroke="white" strokeWidth="5" strokeLinejoin="round">{edge.label}</text>}
                </g>;
              })}
            </svg>
            {visibleMindmapNodes.map((n) => {
              const isSelected = selectedMindmapNode?.id === n.id;
              const isAncestor = selectedMindmapPathIds.has(n.id) && !isSelected;
              const isDescendant = isDescendantOfSelectedMindmapNode(n.id);
              const nodeScale = isSelected ? 1.1 : isDescendant ? 0.92 : isAncestor ? 0.76 : 0.62;
              const nodeOpacity = isSelected || isDescendant ? 1 : isAncestor ? 0.76 : 0.48;
              return <div key={n.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${n.x}%`, top: `${n.y}%`, zIndex: isSelected ? 20 : isAncestor || isDescendant ? 10 : 1 }}>
                <div className="transition-[scale,opacity] duration-300 ease-out" style={{ scale: String(nodeScale), opacity: nodeOpacity }}>
                <button onClick={() => chooseMindmapNode(n)} aria-pressed={selectedMindmapNode?.id === n.id} aria-label={`${n.label}${expandingMindmapNodes.has(n.id) ? ", generating subtopics" : ""}`} className={`w-fit rounded-2xl border text-white transition hover:-translate-y-0.5 ${n.size === "lg" ? "min-w-[14rem] max-w-[28rem] px-7 py-5" : "min-w-[14rem] max-w-[22rem] px-5 py-4"} ${selectedMindmapNode?.id === n.id ? "border-white ring-4 ring-primary-300 shadow-2xl shadow-primary-900/25" : "border-white/30 shadow-xl shadow-indigo-900/20 hover:shadow-2xl"}`} style={{ backgroundColor: n.size === "lg" ? "#6d28d9" : "#4f46e5", backgroundImage: n.size === "lg" ? "linear-gradient(135deg, #6d28d9 0%, #4f46e5 52%, #c026c7 100%)" : "linear-gradient(135deg, #0284c7 0%, #4338ca 100%)", textShadow: "0 1px 2px rgba(15,23,42,0.35)" }}>
                  <span className={`block whitespace-normal break-words [overflow-wrap:anywhere] text-center font-extrabold leading-snug ${n.size === "lg" ? "text-xl" : "text-base"}`}>{n.label}</span>
                  {n.page && <span className="mt-1 block text-center text-xs font-semibold text-white/80">Source · p. {n.page}</span>}
                  {expandingMindmapNodes.has(n.id) && <span className="mt-2 block text-xs font-semibold text-white/90">Generating subtopics…</span>}
                </button>
                {(mindmapChildren[n.id] || []).length > 0 && <button onClick={(event) => { event.stopPropagation(); setCollapsedMindmapNodes((current) => { const next = new Set(current); if (next.has(n.id)) next.delete(n.id); else next.add(n.id); return next; }); }} aria-label={`${collapsedMindmapNodes.has(n.id) ? "Expand" : "Collapse"} ${n.label} branch`} title={`${collapsedMindmapNodes.has(n.id) ? "Expand" : "Collapse"} branch`} className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full border-2 border-white bg-slate-900 text-sm font-bold text-white shadow-md hover:bg-primary-700">{collapsedMindmapNodes.has(n.id) ? "+" : "−"}</button>}
                </div>
              </div>;
            })}
          </div>
          </div>}
          {selectedMindmapNode && <section className="border-t border-slate-200 bg-white p-5" aria-live="polite">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-wider text-primary-600">Selected concept</p>
                <h4 className="mt-1 text-lg font-bold text-slate-900">{selectedMindmapNode.label}</h4>
                <nav aria-label="Mind map breadcrumb" className="mt-2 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                  {selectedMindmapPath.map((node, index) => <span key={node.id} className="inline-flex items-center gap-1">{index > 0 && <span aria-hidden="true">›</span>}<button onClick={() => focusMindmapNode(node)} className={`rounded px-1 py-0.5 hover:bg-primary-50 hover:text-primary-700 ${index === selectedMindmapPath.length - 1 ? "font-bold text-slate-800" : ""}`}>{node.label}</button></span>)}
                </nav>
                <p className="mt-3 max-w-4xl text-sm leading-relaxed text-slate-700">{selectedMindmapNode.summary || selectedMindmapNode.evidence || "Select a concept to inspect its supporting detail."}</p>
                {selectedMindmapNode.details && <p className="mt-2 max-w-4xl text-sm leading-relaxed text-slate-600">{selectedMindmapNode.details}</p>}
                {selectedMindmapNode.example && <p className="mt-3 max-w-4xl rounded-lg bg-amber-50 p-3 text-sm text-amber-950"><strong>Example: </strong>{selectedMindmapNode.example}</p>}
                {!!selectedMindmapNode.key_points?.length && <ul className="mt-3 grid max-w-4xl gap-2 sm:grid-cols-2">{selectedMindmapNode.key_points.map((point, index) => <li key={`${index}-${point}`} className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{selectedMindmapNode.importance && <span className="mr-1 text-amber-500" title="Important concept">★</span>}{point}</li>)}</ul>}
                {!!selectedMindmapNode.related_concepts?.length && <div className="mt-3 flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-wide text-slate-500">Related concepts</span>{selectedMindmapNode.related_concepts.map((concept) => <button key={concept} onClick={() => { const relatedNode = mindmapNodes.find((node) => node.label.toLocaleLowerCase() === concept.toLocaleLowerCase()); if (relatedNode) chooseMindmapNode(relatedNode); else { setMindmapSearch(concept); expandMindmapNode(selectedMindmapNode.id); } }} className="rounded-full border border-primary-100 bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-100">{concept}</button>)}</div>}
                {selectedMindmapNode.evidence && <blockquote className="mt-3 max-w-4xl border-l-2 border-primary-300 pl-3 text-sm italic text-slate-500">“{selectedMindmapNode.evidence}”</blockquote>}
              </div>
              {selectedMindmapNode.page && <span className="shrink-0 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700">Source page {selectedMindmapNode.page}</span>}
              <div className="flex flex-wrap gap-2">
                <button onClick={() => expandMindmapNode(selectedMindmapNode.id)} disabled={!generatedMindmap || expandingMindmapNodes.has(selectedMindmapNode.id)} className="rounded-lg border border-primary-200 px-4 py-2.5 text-sm font-bold text-primary-700 hover:bg-primary-50 disabled:opacity-50">{expandingMindmapNodes.has(selectedMindmapNode.id) ? "Generating…" : "Generate deeper branches"}</button>
                <Link to={`/chat?question=${encodeURIComponent(`Explain “${selectedMindmapNode.label}” using my uploaded paper, and cite the relevant page.`)}${generatedMindmap?.source_paper_ids?.[0] ? `&paper_id=${encodeURIComponent(generatedMindmap.source_paper_ids[0])}` : ""}`} className="shrink-0 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-700">Ask in chat</Link>
              </div>
            </div>
          </section>}
        </div>
  );
}
