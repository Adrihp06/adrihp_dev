from pathlib import Path
from html import escape
p=Path(__file__).parent/'images'
INK='#263b35'; MUTED='#53655f'; GREEN='#365b47'; LINE='#acbbb0'; BG='#f5f6f1'; PAPER='#ffffff'
def text(x,y,s,size=20,color=INK,weight=400):
 return f'<text x="{x}" y="{y}" font-family="Arial, sans-serif" font-size="{size}" fill="{color}" font-weight="{weight}">{escape(s)}</text>'
def box(x,y,w,h,title,lines=(),fill=PAPER):
 out=f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" fill="{fill}" stroke="{LINE}"/>'+text(x+22,y+36,title,23,INK,600)
 return out+''.join(text(x+22,y+69+i*27,l,18,MUTED) for i,l in enumerate(lines))
def arrow(points,dashed=False):
 return f'<path d="{points}" fill="none" stroke="{GREEN}" stroke-width="2" marker-end="url(#arrow)"'+(' stroke-dasharray="6 6"' if dashed else '')+'/>'
def svg(name,w,h,title,desc,body):
 content=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" aria-labelledby="title desc"><title id="title">{escape(title)}</title><desc id="desc">{escape(desc)}</desc><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="{GREEN}"/></marker></defs><rect width="{w}" height="{h}" fill="{BG}"/>'+text(40,58,title,32,INK,600)+body+'</svg>'
 (p/name).write_text(content)
body=text(40,92,'Stored evidence and an agent that investigates before deciding.',19,MUTED)
body+=box(40,135,280,110,'Report corpus',['Normalized existing reports'])+arrow('M320 190H370')
body+=box(380,135,580,110,'Qdrant · hybrid index',['Dense: BGE embeddings     +     Sparse: BM25'])
body+=box(40,315,280,130,'New report',['Claude Sonnet 4.5','Structured normalization'])
body+=arrow('M320 380H370')+box(380,305,260,150,'ReAct agent',['Claude Agent SDK','Reason → act → observe'],'#e2eade')
body+=box(700,305,260,150,'Retrieval tool',['Hybrid search + RRF','FlashRank re-ranking'])
body+=arrow('M640 350H690')+arrow('M700 413H650')+arrow('M830 305V255')
body+=text(705,495,'Ranked candidates',18,MUTED)+arrow('M510 455V540')
body+=box(380,550,580,100,'Assessment + reasoning',['Duplicate, similar or new report'])
body+=text(40,708,'Conceptual architecture · Original publication: December 2025',16,MUTED)
svg('architecture.svg',1000,740,'Mnemosyne: retrieval meets reasoning','A corpus of normalized reports is indexed in Qdrant. A new normalized report enters a ReAct agent, which calls hybrid retrieval and FlashRank before returning an assessment.',body)
body=text(40,92,'Structure changes. Technical artifacts do not.',19,MUTED)
body+=box(40,135,410,240,'Raw report',['Narrative description','Vulnerability details','Code and payloads','Steps to reproduce'])
body+=arrow('M450 255H540')+box(550,135,410,240,'Structured report',['Vulnerability type + severity','Affected components','Technical artifacts','Reproduction steps'],'#e2eade')
body+=text(40,426,'Normalization · Claude Sonnet 4.5',20,INK,600)
body+=f'<rect x="40" y="460" width="920" height="135" rx="8" fill="{INK}"/>'
body+=text(65,498,'Preserved character-for-character',23,'#f5f6f1',600)
body+=text(65,543,"Payloads: \\u0000     ·     Paths: /api/v1/login     ·     Regex patterns",20,'#d3e3d9')
svg('normalization.svg',1000,630,'Normalize the report, preserve the exploit','Normalization extracts fields without modifying payloads, paths or regular expressions.',body)
body=text(40,92,'Search, inspect, refine. Stop when there is sufficient evidence.',19,MUTED)
body+=box(40,150,270,130,'Reason',['Choose a search angle','Description, payload, path'],'#e2eade')+arrow('M310 215H365')
body+=box(375,150,255,130,'Act',['Hybrid retrieval','Cross-encoder re-ranking'])+arrow('M630 215H685')
body+=box(695,150,265,130,'Observe',['Inspect candidates','Verify component + vector'])
body+=arrow('M825 280V360H180V290')+text(335,346,'Evidence incomplete → refine the query',18,MUTED)
body+=arrow('M825 360V420')+box(520,430,440,115,'Return an assessment',['Duplicate · Similar · New'],'#e2eade')
body+=text(40,620,'Early stopping hook: top score > 0.9',23,INK,600)+text(40,653,'Decision thresholds and the hook serve different roles.',18,MUTED)
svg('agent-workflow.svg',1000,690,'The investigation loop','The agent chooses a query, calls retrieval, inspects evidence and either refines its search or returns an assessment. The early stopping hook uses a score above 0.9.',body)
