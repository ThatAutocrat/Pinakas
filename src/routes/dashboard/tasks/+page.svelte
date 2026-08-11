<script>
  let { data } = $props();
  let { tasks } = data;

  const cols = ['Backlog', 'To do', 'In progress', 'Done'];
  let filterStatus = $state('All');
  let filterPriority = $state('All');
  let search = $state('');
  let localTasks = $state(tasks);
  let pendingTasks = $state(new Set());
  let selectedTask = $state(null);

  function setPending(id, val) {
    const next = new Set(pendingTasks);
    if (val) next.add(id); else next.delete(id);
    pendingTasks = next;
  }

  const filtered = $derived(localTasks.filter(t => {
    if (filterStatus !== 'All' && t.status !== filterStatus) return false;
    if (filterPriority !== 'All' && t.priority !== filterPriority) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }));

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `${day}d ago`;
    const wk = Math.floor(day / 7);
    if (wk < 5) return `${wk}w ago`;
    return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const statusDot = {'Backlog':'#b4b2a9','To do':'#378ADD','In progress':'#EF9F27','Done':'#639922'};
  const priorityColors = {
    Critical:{bg:'#FCEBEB',c:'#791F1F'}, High:{bg:'#FAEEDA',c:'#633806'},
    Medium:  {bg:'#E6F1FB',c:'#0C447C'}, Low: {bg:'#EAF3DE',c:'#27500A'}
  };

  async function patchTask(taskId, patch) {
    setPending(taskId, true);
    localTasks = localTasks.map(t => t.id === taskId ? { ...t, ...patch } : t);
    if (selectedTask?.id === taskId) selectedTask = { ...selectedTask, ...patch };
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH', headers: {'Content-Type':'application/json'},
      body: JSON.stringify(patch)
    });
    setPending(taskId, false);
  }

  function openTask(task) {
    selectedTask = { ...task };
  }

  function closeTask() {
    selectedTask = null;
  }
</script>

<svelte:head><title>My Tasks — Pinakas</title></svelte:head>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape') closeTask(); }} />

<div class="page">
  <div class="topbar">
    <div>
      <h1>My Tasks</h1>
      <p class="sub">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</p>
    </div>
    <div class="filters">
      <input class="search" bind:value={search} placeholder="🔍 Search tasks..." />
      <select bind:value={filterStatus}>
        <option value="All">All statuses</option>
        {#each cols as c}<option>{c}</option>{/each}
      </select>
      <select bind:value={filterPriority}>
        <option value="All">All priorities</option>
        {#each ['Critical','High','Medium','Low'] as p}<option>{p}</option>{/each}
      </select>
    </div>
  </div>

  <div class="layout" class:panel-open={!!selectedTask}>
    <div class="task-list">
      {#if filtered.length === 0}
        <div class="empty">
          {#if tasks.length === 0}
            No tasks yet. Create a project and add some tasks ✨
          {:else}
            No tasks match your filters
          {/if}
        </div>
      {/if}
      {#each filtered as task}
        <div
          class="task-row"
          class:task-pending={pendingTasks.has(task.id)}
          class:selected={selectedTask?.id === task.id}
          onclick={() => openTask(task)}
          onkeydown={(e) => e.key === 'Enter' && openTask(task)}
          tabindex="0"
          role="button"
        >
          <span class="status-dot" style="background:{statusDot[task.status]}"></span>
          <div class="task-main">
            <div class="task-title" class:done={task.status==='Done'}>{task.title}</div>
            {#if task.project}
              <a href="/dashboard/projects/{task.project.id}" class="project-chip"
                style="background:{task.project.color}22;color:{task.project.color}"
                onclick={(e) => e.stopPropagation()}>
                {task.project.name}
              </a>
            {/if}
          </div>
          <div class="task-meta">
            <span class="meta-chip" title={new Date(task.created_at).toLocaleString()}>
              🕐 {timeAgo(task.created_at)}
            </span>
            {#if task.checklist?.length}
              <span class="meta-chip">☑ {task.checklist.filter(i=>i.done).length}/{task.checklist.length}</span>
            {/if}
            {#if task.due_date}
              <span class="meta-chip">📅 {task.due_date}</span>
            {/if}
            <span class="priority-pill"
              style="background:{(priorityColors[task.priority]??priorityColors.Medium).bg};color:{(priorityColors[task.priority]??priorityColors.Medium).c}">
              {task.priority}
            </span>
            <select class="status-select" value={task.status}
              onclick={(e) => e.stopPropagation()}
              onchange={(e) => { e.stopPropagation(); patchTask(task.id, { status: e.target.value }); }}>
              {#each cols as c}<option>{c}</option>{/each}
            </select>
          </div>
        </div>
      {/each}
    </div>

    <!-- Detail panel -->
    {#if selectedTask}
      <div class="detail-panel">
        <div class="dp-head">
          <span class="dp-title">{selectedTask.title}</span>
          <button class="close-btn" onclick={closeTask}>&times;</button>
        </div>

        <div class="dp-field">
          <div class="dp-label">Created</div>
          <div class="dp-val">
            {new Date(selectedTask.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            at {new Date(selectedTask.created_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            <span style="color:var(--hint)">({timeAgo(selectedTask.created_at)})</span>
          </div>
        </div>

        {#if selectedTask.project}
          <a href="/dashboard/projects/{selectedTask.project.id}" class="project-chip-lg"
            style="background:{selectedTask.project.color}22;color:{selectedTask.project.color};border-color:{selectedTask.project.color}44">
            <span class="proj-dot" style="background:{selectedTask.project.color}"></span>
            {selectedTask.project.name}
          </a>
        {/if}

        <div class="dp-field">
          <div class="dp-label">Priority</div>
          <div class="priority-grid">
            {#each ['Critical','High','Medium','Low'] as p}
              <button
                class="priority-opt"
                class:active={selectedTask.priority === p}
                style="--bg:{priorityColors[p].bg};--c:{priorityColors[p].c}"
                onclick={() => patchTask(selectedTask.id, { priority: p })}
              >
                {p}
              </button>
            {/each}
          </div>
        </div>

        <div class="dp-field">
          <div class="dp-label">Status</div>
          <select class="dp-select" value={selectedTask.status}
            onchange={(e) => patchTask(selectedTask.id, { status: e.target.value })}>
            {#each cols as c}<option>{c}</option>{/each}
          </select>
        </div>

        {#if selectedTask.due_date}
          <div class="dp-field">
            <div class="dp-label">Due date</div>
            <div class="dp-val">📅 {selectedTask.due_date}</div>
          </div>
        {/if}

        {#if selectedTask.checklist?.length}
          <div class="dp-field">
            <div class="dp-label">Checklist ({selectedTask.checklist.filter(c=>c.done).length}/{selectedTask.checklist.length})</div>
            <div class="checklist-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width:{Math.round((selectedTask.checklist.filter(c=>c.done).length/selectedTask.checklist.length)*100)}%"></div>
              </div>
              <span class="progress-pct">{Math.round((selectedTask.checklist.filter(c=>c.done).length/selectedTask.checklist.length)*100)}%</span>
            </div>
            {#each selectedTask.checklist as item}
              <div class="check-item" class:checked={item.done}>
                <span class="check-icon">{item.done ? '☑' : '☐'}</span>
                {item.text}
              </div>
            {/each}
          </div>
        {/if}

        <a href="/dashboard/projects/{selectedTask.project?.id}" class="view-project-btn">
          <i class="ti ti-external-link"></i> Open in project
        </a>
      </div>
    {/if}
  </div>
</div>

<style>
.page { display:flex; flex-direction:column; height:100%; }
.topbar { display:flex; align-items:flex-start; justify-content:space-between; padding:1.25rem 1.5rem; background:var(--surface); border-bottom:0.5px solid var(--border); flex-shrink:0; gap:1rem; flex-wrap:wrap; }
h1 { font-size:1.1rem; font-weight:600; margin:0 0 2px; color:var(--text); }
.sub { font-size:12px; color:var(--hint); margin:0; }
.filters { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
.search { padding:6px 10px; border:0.5px solid var(--border-hover); border-radius:8px; font-size:13px; font-family:inherit; outline:none; width:180px; background:var(--surface); color:var(--text); }
.search:focus { border-color:var(--accent); }
select { padding:6px 10px; border:0.5px solid var(--border-hover); border-radius:8px; font-size:13px; font-family:inherit; background:var(--surface); color:var(--text); outline:none; cursor:pointer; }

.layout { display:flex; flex:1; overflow:hidden; }
.task-list { flex:1; overflow-y:auto; padding:1.25rem 1.5rem; display:flex; flex-direction:column; gap:6px; }

.task-row { display:flex; align-items:center; gap:12px; background:var(--surface); border:0.5px solid var(--border); border-radius:10px; padding:0.75rem 1rem; transition:border-color 0.15s; cursor:pointer; }
.task-row:hover { border-color:var(--border-hover); }
.task-row.selected { border-color:var(--accent); border-width:1px; }
.task-row.task-pending { opacity:0.65; }
.task-row.task-pending .status-dot { animation:spin 0.7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.status-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.task-main { flex:1; display:flex; align-items:center; gap:10px; min-width:0; }
.task-title { font-size:13px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:var(--text); }
.task-title.done { text-decoration:line-through; color:var(--hint); }
.project-chip { font-size:11px; padding:2px 8px; border-radius:20px; font-weight:500; white-space:nowrap; flex-shrink:0; text-decoration:none; }
.task-meta { display:flex; align-items:center; gap:8px; flex-shrink:0; }
.meta-chip { font-size:11px; color:var(--muted); white-space:nowrap; }
.priority-pill { font-size:11px; padding:2px 8px; border-radius:20px; font-weight:500; white-space:nowrap; }
.status-select { font-size:11px; padding:3px 6px; border-radius:6px; border:0.5px solid var(--border-hover); background:var(--surface); color:var(--text); }
.empty { text-align:center; padding:3rem; color:var(--hint); font-size:14px; }

/* Detail panel */
.detail-panel { width:300px; flex-shrink:0; background:var(--surface); border-left:0.5px solid var(--border); padding:1.25rem; display:flex; flex-direction:column; gap:0; overflow-y:auto; }
.dp-head { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; margin-bottom:12px; }
.dp-title { font-size:14px; font-weight:600; line-height:1.4; flex:1; color:var(--text); }
.close-btn { background:none; border:none; font-size:20px; color:var(--hint); cursor:pointer; line-height:1; flex-shrink:0; }
.close-btn:hover { color:var(--text); }
.project-chip-lg { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:500; padding:3px 10px; border-radius:20px; border:0.5px solid; text-decoration:none; margin-bottom:16px; }
.proj-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
.dp-field { margin-bottom:1.1rem; }
.dp-label { font-size:10px; color:var(--hint); text-transform:uppercase; letter-spacing:0.07em; font-weight:600; margin-bottom:6px; }
.dp-val { font-size:12px; color:var(--muted); }
.dp-select { width:100%; font-size:12px; padding:6px 10px; border:0.5px solid var(--border-hover); border-radius:8px; background:var(--surface); color:var(--text); font-family:inherit; }

/* Priority grid */
.priority-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
.priority-opt { padding:6px 0; border-radius:8px; border:0.5px solid transparent; font-size:12px; font-weight:500; cursor:pointer; font-family:inherit; background:var(--bg); color:var(--muted); transition:all 0.12s; }
.priority-opt:hover { background:var(--bg); border-color:var(--border-hover); color:var(--text); }
.priority-opt.active { background:var(--bg); border-color:var(--c); color:var(--c); background:var(--bg); }
.priority-opt.active { background:var(--bg); border-color:var(--c,var(--accent)); color:var(--c,var(--accent)); }

/* Checklist */
.checklist-progress { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.progress-bar { flex:1; height:4px; background:var(--bg); border-radius:2px; overflow:hidden; border:0.5px solid var(--border); }
.progress-fill { height:100%; background:var(--accent); border-radius:2px; transition:width 0.2s; }
.progress-pct { font-size:10px; color:var(--hint); white-space:nowrap; }
.check-item { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--muted); padding:3px 0; }
.check-item.checked { text-decoration:line-through; color:var(--hint); }
.check-icon { font-size:13px; flex-shrink:0; }

.view-project-btn { display:inline-flex; align-items:center; gap:5px; margin-top:auto; padding-top:1rem; font-size:12px; color:var(--accent); text-decoration:none; font-weight:500; border-top:0.5px solid var(--border); }
.view-project-btn:hover { text-decoration:underline; }
</style>
