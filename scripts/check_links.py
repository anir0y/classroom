"""Build check: every post is linked from at least 2 other post pages, and every
room listed on a path page carries the path strip.
Usage: hugo --environment production -d /some/tmp/dir, then python3 scripts/check_links.py /some/tmp/dir"""
import sys,re,glob,os,collections
b=sys.argv[1]
posts={}
for f in glob.glob(b+'/post/*/index.html'):
    slug='/post/'+os.path.basename(os.path.dirname(f))+'/'
    h=open(f,encoding='utf-8').read()
    m=re.search(r'<article class="?post-single.*?</article>',h,re.S)
    if m: posts[slug]=m.group(0)
inb=collections.defaultdict(set)
for slug,h in posts.items():
    for t in set(re.findall(r'href="?(?:https://classroom\.anir0y\.in)?(/post/[^/"#? >]+/)',h)):
        if t!=slug and t in posts: inb[t].add(slug)
low=sorted((len(inb[s]),s) for s in posts if len(inb[s])<2)
print('posts',len(posts),'with <2 inbound:',len(low)); [print('  ',n,s) for n,s in low[:15]]
miss=[]; rooms=0
for f in glob.glob(b+'/paths/*/index.html'):
    h=open(f,encoding='utf-8').read()
    for r in re.findall(r'<li data-room="?([^" >]+)',h):
        rooms+=1
        if 'class=path-strip' not in posts.get(r,'') and 'class="path-strip' not in posts.get(r,''): miss.append(r)
print('path rooms',rooms,'without strip:',len(miss),miss[:5])
h1=[s for s,h in posts.items() if len(re.findall(r'<h1[ >]',h))>1]
print('posts with >1 h1:',len(h1))
