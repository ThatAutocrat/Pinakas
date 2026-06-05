<script>
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  let { data, children } = $props();
  const { user, projects } = $derived(data);

  const navItems = [
    { href: '/dashboard',          icon: 'ti-layout-kanban', label: 'Board'    },
    { href: '/dashboard/tasks',    icon: 'ti-list-check',    label: 'My Tasks' },
    { href: '/dashboard/calendar', icon: 'ti-calendar',      label: 'Calendar' },
  ];
  const projectColors = ['#378ADD','#639922','#D4537E','#EF9F27','#534AB7','#1D9E75'];

  // ── Dark mode ──────────────────────────────────────────────
  let dark = $state(false);
  onMount(() => {
    dark = localStorage.getItem('theme') === 'dark';
    applyTheme(dark);
  });
  function toggleDark() {
    dark = !dark;
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    applyTheme(dark);
  }
  function applyTheme(d) {
    document.documentElement.setAttribute('data-theme', d ? 'dark' : 'light');
  }

  // ── Search ─────────────────────────────────────────────────
  let searchQuery = $state('');
  let searchOpen = $state(false);
  let searchResults = $state([]);
  let searchTimeout;

  async function onSearch(e) {
    searchQuery = e.target.value;
    clearTimeout(searchTimeout);
    if (!searchQuery.trim()) { searchResults = []; return; }
    searchTimeout = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      searchResults = await res.json();
    }, 200);
  }

  function closeSearch() { searchOpen = false; searchQuery = ''; searchResults = []; }
</script>

<svelte:window onkeydown={(e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); searchOpen = !searchOpen; }
  if (e.key === 'Escape') closeSearch();
}} />

<div class="layout">
  <aside class="sidebar">
    <div class="logo">Pina<span>kas</span></div>

    <!-- Search trigger -->
    <button class="search-trigger" onclick={() => searchOpen = true}>
      <i class="ti ti-search"></i>
      <span>Search...</span>
      <kbd>⌘K</kbd>
    </button>

    <nav>
      <div class="nav-label">Workspace</div>
      {#each navItems as item}
        <a href={item.href} class="nav-item"
          class:active={$page.url.pathname === item.href}>
          <i class="ti {item.icon}"></i> {item.label}
        </a>
      {/each}

      <div class="nav-label" style="margin-top:0.75rem">Projects
        {#if projects.length === 0}
          <span class="no-proj-hint"> — none yet</span>
        {/if}
      </div>
      {#each projects as project, i}
        <a href="/dashboard/projects/{project.id}" class="nav-item"
          class:active={$page.url.pathname.includes(project.id)}>
          <span class="dot" style="background:{project.color ?? projectColors[i % projectColors.length]}"></span>
          <span class="proj-name">{project.name}</span>
          <span class="task-count">{project._count?.tasks ?? 0}</span>
        </a>
      {/each}
      <a href="/dashboard/projects/new" class="nav-item muted">
        <i class="ti ti-plus"></i> New project
      </a>
    </nav>

    <div class="sidebar-footer">
      <button class="theme-toggle" onclick={toggleDark} title="Toggle dark mode">
        <i class="ti {dark ? 'ti-sun' : 'ti-moon'}"></i>
        {dark ? 'Light mode' : 'Dark mode'}
      </button>
      <div class="user-row">
        <div class="avatar" style="background:{user.color ?? '#EAF3DE'};color:{user.textColor ?? '#27500A'}">
          {user.initials ?? user.name?.[0] ?? '?'}
        </div>
        <div class="user-info">
          <div class="user-name">{user.name}</div>
          <div class="user-email">{user.email}</div>
        </div>
      </div>
      <form method="POST" action="/logout">
        <button type="submit" class="btn" style="width:100%;justify-content:center;margin-top:8px;font-size:12px">
          <i class="ti ti-logout"></i> Sign out
        </button>
      </form>
    </div>
  </aside>

  <main class="content">
    {#if projects.length === 0 && $page.url.pathname === '/dashboard'}
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h2>No projects yet</h2>
        <p>Create your first project to start adding tasks.</p>
        <a href="/dashboard/projects/new" class="btn btn-primary">
          <i class="ti ti-plus"></i> Create a project
        </a>
      </div>
    {:else}
      {@render children()}
    {/if}
  </main>
</div>

<!-- Search modal -->
{#if searchOpen}
  <div class="search-overlay" role="presentation" onclick={(e) => e.target === e.currentTarget && closeSearch()}>
    <div class="search-modal" role="dialog" aria-label="Search">
      <div class="search-input-wrap">
        <i class="ti ti-search search-icon"></i>
        <input
          class="search-input"
          placeholder="Search tasks, projects..."
          value={searchQuery}
          oninput={onSearch}
          autofocus
        />
        {#if searchQuery}
          <button class="clear-btn" onclick={() => { searchQuery = ''; searchResults = []; }}>×</button>
        {/if}
      </div>
      <div class="search-results">
        {#if searchQuery && searchResults.length === 0}
          <div class="search-empty">No results for "{searchQuery}"</div>
        {/if}
        {#each searchResults as r}
          <a href={r.href} class="search-result" onclick={closeSearch}>
            <i class="ti {r.type === 'task' ? 'ti-checkbox' : 'ti-folder'} result-icon"></i>
            <div class="result-body">
              <div class="result-title">{r.title}</div>
              {#if r.subtitle}<div class="result-sub">{r.subtitle}</div>{/if}
            </div>
            <span class="result-type">{r.type}</span>
          </a>
        {/each}
      </div>
      <div class="search-footer">
        <span><kbd>↑↓</kbd> navigate</span>
        <span><kbd>↵</kbd> open</span>
        <span><kbd>Esc</kbd> close</span>
      </div>
    </div>
  </div>
{/if}

<style>
.layout { display:grid; grid-template-columns:220px 1fr; min-height:100vh; }

.sidebar {
  background:var(--surface); border-right:0.5px solid var(--border);
  padding:1.25rem 0; display:flex; flex-direction:column;
  position:sticky; top:0; height:100vh; overflow-y:auto;
}
.logo { font-size:1.2rem; font-weight:800; padding:0 1rem 1rem; border-bottom:0.5px solid var(--border); margin-bottom:0.5rem; color:var(--text); }
.logo span { color:var(--accent); }

.search-trigger { display:flex; align-items:center; gap:8px; margin:0.5rem 0.75rem; padding:6px 10px; background:var(--bg); border:0.5px solid var(--border); border-radius:8px; font-size:12px; color:var(--hint); cursor:pointer; width:calc(100% - 1.5rem); font-family:inherit; }
.search-trigger:hover { border-color:var(--accent); color:var(--muted); }
.search-trigger kbd { margin-left:auto; font-size:10px; background:var(--border); padding:1px 5px; border-radius:4px; }

nav { flex:1; }
.nav-label { font-size:10px; color:var(--hint); text-transform:uppercase; letter-spacing:0.08em; padding:0.75rem 1rem 0.25rem; font-weight:600; }
.no-proj-hint { text-transform:none; letter-spacing:0; font-weight:400; color:var(--hint); }
.nav-item { display:flex; align-items:center; gap:8px; padding:0.45rem 1rem; font-size:13px; color:var(--muted); transition:background 0.1s,color 0.1s; }
.nav-item:hover { background:var(--bg); color:var(--text); }
.nav-item.active { background:var(--accent-light); color:var(--accent-text); font-weight:500; }
.nav-item.muted { color:var(--hint); font-size:12px; }
.dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.proj-name { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.task-count { margin-left:auto; font-size:11px; background:var(--bg); padding:1px 6px; border-radius:10px; color:var(--muted); flex-shrink:0; }

.sidebar-footer { padding:1rem; border-top:0.5px solid var(--border); margin-top:auto; display:flex; flex-direction:column; gap:8px; }
.theme-toggle { display:flex; align-items:center; gap:8px; background:none; border:0.5px solid var(--border); border-radius:8px; padding:6px 10px; font-size:12px; color:var(--muted); cursor:pointer; font-family:inherit; width:100%; }
.theme-toggle:hover { background:var(--bg); color:var(--text); }
.user-row { display:flex; align-items:center; gap:8px; }
.avatar { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:11px; flex-shrink:0; }
.user-name { font-size:13px; font-weight:500; color:var(--text); }
.user-email { font-size:11px; color:var(--muted); }
.content { min-height:100vh; display:flex; flex-direction:column; background:var(--bg); }

/* Empty state */
.empty-state { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:3rem; text-align:center; }
.empty-icon { font-size:3rem; }
.empty-state h2 { font-size:1.1rem; font-weight:600; color:var(--text); margin:0; }
.empty-state p { font-size:13px; color:var(--muted); margin:0; }

/* Search modal */
.search-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:500; display:flex; align-items:flex-start; justify-content:center; padding-top:15vh; }
.search-modal { background:var(--surface); border:0.5px solid var(--border); border-radius:14px; width:560px; max-width:90vw; box-shadow:0 20px 60px rgba(0,0,0,0.2); overflow:hidden; }
.search-input-wrap { display:flex; align-items:center; gap:10px; padding:0.875rem 1rem; border-bottom:0.5px solid var(--border); }
.search-icon { color:var(--hint); font-size:16px; flex-shrink:0; }
.search-input { flex:1; border:none; background:transparent; font-size:15px; color:var(--text); outline:none; font-family:inherit; }
.search-input::placeholder { color:var(--hint); }
.clear-btn { background:none; border:none; color:var(--hint); font-size:18px; cursor:pointer; padding:0 4px; }
.search-results { max-height:340px; overflow-y:auto; }
.search-empty { padding:2rem; text-align:center; color:var(--hint); font-size:13px; }
.search-result { display:flex; align-items:center; gap:10px; padding:0.65rem 1rem; transition:background 0.1s; border-bottom:0.5px solid var(--border); }
.search-result:hover { background:var(--bg); }
.result-icon { color:var(--hint); font-size:16px; flex-shrink:0; }
.result-body { flex:1; min-width:0; }
.result-title { font-size:13px; font-weight:500; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.result-sub { font-size:11px; color:var(--muted); margin-top:1px; }
.result-type { font-size:10px; color:var(--hint); background:var(--bg); padding:2px 7px; border-radius:20px; flex-shrink:0; text-transform:uppercase; letter-spacing:0.05em; }
.search-footer { display:flex; gap:1rem; padding:0.6rem 1rem; border-top:0.5px solid var(--border); background:var(--bg); }
.search-footer span { font-size:11px; color:var(--hint); display:flex; align-items:center; gap:4px; }
.search-footer kbd { background:var(--border); border-radius:3px; padding:1px 5px; font-size:10px; color:var(--muted); }
</style>