<script>
  let { data } = $props();
  let { allTasks } = data;

  const cols = ['Backlog', 'To do', 'In progress', 'Done'];
  const colDots = { 'Backlog':'#B4B2A9', 'To do':'#378ADD', 'In progress':'#EF9F27', 'Done':'#639922' };

  const priorityColors = {
    Critical: { bg:'#FCEBEB', c:'#791F1F' },
    High:     { bg:'#FAEEDA', c:'#633806' },
    Medium:   { bg:'#E6F1FB', c:'#0C447C' },
    Low:      { bg:'#EAF3DE', c:'#27500A' }
  };

  function tasksForCol(col) {
    return allTasks
      .filter(t => t.status === col)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }

  const totalTasks = $derived(allTasks.length);
  const doneTasks  = $derived(allTasks.filter(t => t.status === 'Done').length);
  const donePct    = $derived(totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0);
</script>

<svelte:head><title>Dashboard — Pinakas</title></svelte:head>

<div class="topbar">
  <div class="tl">
    <h1>All Tasks</h1>
    <span class="sub">{totalTasks} task{totalTasks !== 1 ? 's' : ''} across all projects</span>
  </div>
  <div class="stats">
    <div class="stat">
      <span class="stat-n">{totalTasks}</span>
      <span class="stat-l">Total</span>
    </div>
    <div class="stat">
      <span class="stat-n">{doneTasks}</span>
      <span class="stat-l">Done</span>
    </div>
    <div class="stat">
      <span class="stat-n">{allTasks.filter(t => t.status === 'In progress').length}</span>
      <span class="stat-l">In progress</span>
    </div>
    <div class="stat">
      <span class="stat-n">{donePct}%</span>
      <span class="stat-l">Complete</span>
    </div>
  </div>
</div>

<div class="board">
  {#each cols as col}
    <div class="column">
      <div class="col-header">
        <span class="col-dot" style="background:{colDots[col]}"></span>
        <span class="col-name">{col}</span>
        <span class="col-count">{tasksForCol(col).length}</span>
      </div>

      <div class="cards">
        {#each tasksForCol(col) as task}
          <div class="task-card" class:done={col === 'Done'}>
            <div class="card-top">
              {#if task.tag}
                <span class="task-tag">{task.tag}</span>
              {/if}
              {#if task.priority && task.priority !== 'Medium'}
                <span class="priority-chip"
                  style="background:{(priorityColors[task.priority] ?? priorityColors.Medium).bg};color:{(priorityColors[task.priority] ?? priorityColors.Medium).c}">
                  {task.priority}
                </span>
              {/if}
            </div>

            <div class="task-title" class:strikethrough={col === 'Done'}>{task.title}</div>

            <div class="card-foot">
              <!-- Project chip -->
              <a href="/dashboard/projects/{task.project.id}" class="proj-chip"
                style="background:{task.project.color}18;border-color:{task.project.color}44;color:{task.project.color}">
                <span class="proj-dot" style="background:{task.project.color}"></span>
                {task.project.name}
              </a>

              <div class="card-meta">
                {#if task.checklistTotal > 0}
                  <span class="meta-item" title="Checklist">
                    ☑ {task.checklistDone}/{task.checklistTotal}
                  </span>
                {/if}
                {#if task.commentCount > 0}
                  <span class="meta-item" title="Comments">
                    💬 {task.commentCount}
                  </span>
                {/if}
                {#if task.due_date}
                  <span class="meta-item due">
                    <i class="ti ti-calendar"></i> {task.due_date}
                  </span>
                {/if}
              </div>
            </div>
          </div>
        {/each}

        {#if tasksForCol(col).length === 0}
          <div class="col-empty">No tasks</div>
        {/if}
      </div>
    </div>
  {/each}
</div>

<style>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: var(--surface);
  border-bottom: 0.5px solid var(--border);
  flex-shrink: 0;
}
.tl { display: flex; flex-direction: column; gap: 2px; }
h1 { font-size: 1rem; font-weight: 600; margin: 0; color: var(--text); }
.sub { font-size: 12px; color: var(--hint); }

.stats { display: flex; gap: 0; }
.stat {
  display: flex; flex-direction: column; align-items: center;
  gap: 1px; padding: 4px 20px;
  border-left: 0.5px solid var(--border);
}
.stat-n { font-size: 1.2rem; font-weight: 600; color: var(--text); line-height: 1; }
.stat-l { font-size: 10px; color: var(--hint); text-transform: uppercase; letter-spacing: 0.05em; }

.board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  flex: 1;
  overflow: hidden;
  height: calc(100vh - 65px);
}

.column {
  display: flex;
  flex-direction: column;
  border-right: 0.5px solid var(--border);
  overflow: hidden;
}
.column:last-child { border-right: none; }

.col-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0.75rem 1rem;
  background: var(--surface);
  border-bottom: 0.5px solid var(--border);
  flex-shrink: 0;
}
.col-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.col-name { font-size: 12px; font-weight: 500; color: var(--muted); flex: 1; }
.col-count {
  font-size: 11px; background: var(--bg);
  padding: 1px 7px; border-radius: 10px; color: var(--hint);
}

.cards {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.task-card {
  background: var(--surface);
  border: 0.5px solid var(--border);
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
  cursor: default;
  transition: border-color 0.1s;
}
.task-card.done { opacity: 0.6; }

.card-top {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 5px;
  flex-wrap: wrap;
}

.task-tag {
  font-size: 10px; padding: 1px 6px; border-radius: 4px;
  background: var(--bg); color: var(--muted); font-weight: 500;
}
.priority-chip {
  font-size: 10px; padding: 1px 6px; border-radius: 4px; font-weight: 500;
}

.task-title {
  font-size: 13px; font-weight: 500; line-height: 1.4;
  color: var(--text); margin-bottom: 8px;
}
.task-title.strikethrough { text-decoration: line-through; color: var(--hint); }

.card-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  flex-wrap: wrap;
}

.proj-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 20px;
  border: 0.5px solid;
  text-decoration: none;
  flex-shrink: 0;
  transition: opacity 0.15s;
}
.proj-chip:hover { opacity: 0.75; }
.proj-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

.card-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.meta-item {
  font-size: 10px; color: var(--hint);
  display: flex; align-items: center; gap: 2px;
}
.meta-item.due { color: var(--muted); }

.col-empty {
  font-size: 12px; color: var(--hint);
  text-align: center; padding: 2rem 0;
}
</style>
