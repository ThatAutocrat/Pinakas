<script>
  import { enhance } from '$app/forms';

  let { data } = $props();
  let { projects, notesByMonth } = data;

  const today = new Date();
  let viewYear  = $state(today.getFullYear());
  let viewMonth = $state(today.getMonth());

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const firstDay    = $derived(new Date(viewYear, viewMonth, 1).getDay());
  const daysInMonth = $derived(new Date(viewYear, viewMonth + 1, 0).getDate());
  const calDays     = $derived(Array.from({length: firstDay + daysInMonth}, (_, i) => i < firstDay ? null : i - firstDay + 1));

  function pad(n) { return String(n).padStart(2,'0'); }
  function dateKey(y, m, d) { return `${y}-${pad(m+1)}-${pad(d)}`; }
  const monthKey = $derived(`${viewYear}-${pad(viewMonth + 1)}`);

  const projectsByDate = $derived(projects.reduce((acc, p) => {
    const key = p.due_date.slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {}));

  function isToday(d) {
    return d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
  }
  function prev() { if (viewMonth===0){viewMonth=11;viewYear--;} else viewMonth--; }
  function next() { if (viewMonth===11){viewMonth=0;viewYear++;} else viewMonth++; }

  const statusColors = { 'On track':'#639922', 'At risk':'#EF9F27', 'Off track':'#A32D2D', 'Complete':'#378ADD' };

  // Notes state — local copy so typing feels instant
  let localNotes = $state({ ...notesByMonth });
  let saveTimeout = null;
  let saving = $state(false);
  let saved = $state(false);

  // Keep localNotes in sync when month changes and note hasn't been edited yet
  $effect(() => {
    if (!(monthKey in localNotes)) {
      localNotes[monthKey] = notesByMonth[monthKey] ?? '';
    }
  });

  let formEl = $state(null);

  function onNoteInput(e) {
    localNotes[monthKey] = e.target.value;
    saved = false;
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      formEl?.requestSubmit();
    }, 800);
  }
</script>

<svelte:head><title>Calendar — Pinakas</title></svelte:head>

<div class="page">
  <div class="topbar">
    <button class="nav-btn" onclick={prev}>‹</button>
    <h1>{monthNames[viewMonth]} {viewYear}</h1>
    <button class="nav-btn" onclick={next}>›</button>
    <button class="today-btn" onclick={() => { viewMonth = today.getMonth(); viewYear = today.getFullYear(); }}>
      Today
    </button>
    <span class="proj-count">{projects.length} project{projects.length!==1?'s':''} with due dates</span>
  </div>

  <div class="cal-grid">
    {#each dayNames as d}
      <div class="day-name">{d}</div>
    {/each}
    {#each calDays as d}
      <div class="day-cell" class:today={d && isToday(d)} class:empty={!d}>
        {#if d}
          <div class="day-num" class:today-num={isToday(d)}>{d}</div>
          {@const key = dateKey(viewYear, viewMonth, d)}
          {#each (projectsByDate[key] || []) as project}
            <a href="/dashboard/projects/{project.id}" class="project-pill"
              style="background:{project.color}22;border-left:3px solid {project.color}">
              <span class="pill-name">{project.name}</span>
              <span class="pill-status" style="color:{statusColors[project.status] ?? '#b4b2a9'}">{project.status ?? 'On track'}</span>
            </a>
          {/each}
        {/if}
      </div>
    {/each}
  </div>

  {#if projects.length === 0}
    <div class="no-projects">No projects with due dates yet. Set a due date in project settings to see them here 📅</div>
  {/if}

  <!-- Month notes -->
  <div class="notes-section">
    <div class="notes-header">
      <div class="notes-title">
        <i class="ti ti-notes"></i>
        Notes for {monthNames[viewMonth]} {viewYear}
      </div>
      {#if saving}
        <span class="save-status saving">Saving…</span>
      {:else if saved}
        <span class="save-status saved">Saved ✓</span>
      {/if}
    </div>
    <form
      method="POST"
      action="?/saveNote"
      bind:this={formEl}
      use:enhance={() => {
        saving = true;
        return ({ update }) => {
          update({ reset: false });
          saving = false;
          saved = true;
          setTimeout(() => saved = false, 2000);
        };
      }}
    >
      <input type="hidden" name="monthKey" value={monthKey} />
      <textarea
        class="notes-textarea"
        name="body"
        value={localNotes[monthKey] ?? ''}
        oninput={onNoteInput}
        placeholder="Jot down anything for {monthNames[viewMonth]}… goals, reminders, notes 📝"
        rows="5"
      ></textarea>
    </form>
  </div>
</div>

<style>
.page { padding:1.5rem; }
.topbar { display:flex; align-items:center; gap:12px; margin-bottom:1.25rem; }
h1 { font-size:1.1rem; font-weight:600; margin:0; min-width:160px; text-align:center; color:var(--text); }
.nav-btn { background:var(--surface); border:0.5px solid var(--border); border-radius:8px; width:32px; height:32px; font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--muted); }
.nav-btn:hover { background:var(--bg); color:var(--text); }
.today-btn { background:var(--accent-light); border:none; border-radius:8px; padding:5px 12px; font-size:12px; color:var(--accent-text); font-weight:500; cursor:pointer; font-family:inherit; }
.proj-count { font-size:12px; color:var(--hint); margin-left:8px; }
.cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:1px; background:var(--border); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.day-name { background:var(--bg); padding:8px; font-size:11px; font-weight:600; color:var(--hint); text-align:center; text-transform:uppercase; letter-spacing:0.05em; }
.day-cell { background:var(--surface); min-height:90px; padding:6px; display:flex; flex-direction:column; gap:3px; }
.day-cell.empty { background:var(--bg); opacity:0.5; }
.day-num { font-size:12px; font-weight:500; color:var(--muted); margin-bottom:3px; width:22px; height:22px; display:flex; align-items:center; justify-content:center; border-radius:50%; }
.day-num.today-num { background:var(--accent); color:#fff; }
.project-pill { display:flex; flex-direction:column; gap:1px; font-size:11px; padding:4px 6px; border-radius:4px; color:var(--text); text-decoration:none; transition:opacity 0.15s; overflow:hidden; }
.project-pill:hover { opacity:0.75; }
.pill-name { font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.pill-status { font-size:10px; opacity:0.8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.no-projects { text-align:center; padding:2rem; color:var(--hint); font-size:13px; margin-top:0.5rem; }

/* Notes */
.notes-section { margin-top:1.5rem; background:var(--surface); border:0.5px solid var(--border); border-radius:12px; padding:1rem 1.25rem; }
.notes-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:0.75rem; }
.notes-title { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:600; color:var(--text); }
.notes-title i { color:var(--accent); font-size:15px; }
.save-status { font-size:11px; }
.save-status.saving { color:var(--hint); }
.save-status.saved { color:var(--accent); }
.notes-textarea { width:100%; background:var(--bg); border:0.5px solid var(--border); border-radius:8px; padding:10px 12px; font-size:13px; color:var(--text); font-family:inherit; line-height:1.6; resize:vertical; outline:none; transition:border-color 0.15s; }
.notes-textarea:focus { border-color:var(--accent); }
</style>