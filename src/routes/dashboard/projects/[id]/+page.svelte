<script>
  import { enhance } from '$app/forms';
  import { onMount, onDestroy } from 'svelte';
  import { db } from '$lib/client/db.js';

  let { data } = $props();
  let { project, board, columns, allMembers } = $derived(data);

  let selectedTask = $state(null);
  let showAddTask = $state(null);
  let newTaskTitle = $state('');
  let commentBody = $state('');
  let showReactionPicker = $state(null);

  // Inline editing state
  let editingTitle = $state(false);
  let editingDesc = $state(false);
  let editTitleVal = $state('');
  let editDescVal = $state('');

  // Pending set — task IDs currently awaiting a server response
  let pendingTasks = $state(new Set());

  // Drag state
  let dragTaskId = $state(null);
  let dragFromCol = $state(null);
  let dragOverCol = $state(null);
  let dragOverTaskId = $state(null);
  // Counter per column to handle dragleave/dragenter firing on child elements
  let dragEnterCounts = $state({});

  const ANIME_REACTIONS = [
    { emoji: '🔥', label: 'Sugoi!'   }, { emoji: '😤', label: 'Yosh!'    },
    { emoji: '😭', label: 'Nani?!'   }, { emoji: '✨', label: 'Kawaii'   },
    { emoji: '😅', label: 'Yamete'   }, { emoji: '💪', label: 'Ganbare!' },
    { emoji: '🎉', label: 'Yatta!'   }, { emoji: '😴', label: 'Zzz...'   },
    { emoji: '🤯', label: 'Uso da!'  }, { emoji: '🌸', label: 'Nakama'   }
  ];

  const colDots = { 'Backlog':'#B4B2A9','To do':'#378ADD','In progress':'#EF9F27','Done':'#639922' };

  const totalTasks = $derived(Object.values(board).flat().length);
  const doneTasks  = $derived(board['Done']?.length || 0);
  const inProgress = $derived(board['In progress']?.length || 0);

  // Optimistic local board — sorted by order within each column
  let localBoard = $state(null);
  $effect(() => {
    const clone = structuredClone(board);
    for (const col of Object.keys(clone)) {
      clone[col].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    localBoard = clone;
  });

  function avatarStyle(i) {
    const p = [
      {bg:'#EAF3DE',c:'#27500A'},{bg:'#E6F1FB',c:'#0C447C'},
      {bg:'#FBEAF0',c:'#72243E'},{bg:'#FAEEDA',c:'#633806'},{bg:'#EEEDFE',c:'#3C3489'}
    ];
    return p[i % p.length];
  }

  function getReactionCounts(reactions) {
    const counts = {};
    for (const r of (reactions || [])) counts[r.emoji] = (counts[r.emoji] || 0) + 1;
    return Object.entries(counts).map(([emoji, count]) => ({ emoji, count }));
  }
  function hasUserReacted(reactions, emoji) {
    return (reactions || []).some(r => r.emoji === emoji && r.user_id === data.user?.id);
  }

  function setPending(id, val) {
    const next = new Set(pendingTasks);
    if (val) next.add(id); else next.delete(id);
    pendingTasks = next;
  }

  async function optimisticReaction(taskId, emoji) {
    showReactionPicker = null;
    const res = await fetch(`/api/tasks/${taskId}/reactions`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ emoji })
    });
    const updated = await res.json();
    for (const col of Object.values(localBoard)) {
      const t = col.find(t => t.id === taskId);
      if (t) { t.reactions = updated; break; }
    }
    if (selectedTask?.id === taskId) selectedTask = { ...selectedTask, reactions: updated };
    localBoard = { ...localBoard };
  }

  // Optimistic add task
  async function quickAddTask(col, title) {
    if (!title.trim()) return;
    const maxOrder = Math.max(0, ...(localBoard[col] || []).map(t => t.order ?? 0));
    const temp = {
      id: 'temp-' + Date.now(), title, status: col, tag: 'Feature',
      priority: 'Medium', order: maxOrder + 1,
      assignees: [], checklist: [], comments: [], reactions: []
    };
    localBoard = { ...localBoard, [col]: [...(localBoard[col] || []), temp] };
    showAddTask = null;
    newTaskTitle = '';
    setPending(temp.id, true);

    const res = await fetch('/api/tasks', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ title, status: col, projectId: project.id, order: maxOrder + 1 })
    });
    const real = await res.json();
    setPending(temp.id, false);
    localBoard = { ...localBoard, [col]: localBoard[col].map(t =>
      t.id === temp.id ? { ...real, assignees: [], checklist: [], comments: [], reactions: [] } : t
    )};
  }

  // Optimistic move task (used by chevron buttons + drag & drop)
  async function moveTask(taskId, fromCol, toCol, insertBeforeId = null) {
    if (fromCol === toCol && insertBeforeId === null) return;
    const task = localBoard[fromCol]?.find(t => t.id === taskId);
    if (!task) return;

    // Compute new order
    const destCol = localBoard[toCol] || [];
    let newOrder;
    if (insertBeforeId) {
      const idx = destCol.findIndex(t => t.id === insertBeforeId);
      const before = idx > 0 ? (destCol[idx - 1].order ?? 0) : 0;
      const after  = destCol[idx]?.order ?? (before + 2);
      newOrder = (before + after) / 2;
    } else {
      const max = Math.max(0, ...destCol.map(t => t.order ?? 0));
      newOrder = max + 1;
    }

    // Optimistic update
    const updatedTask = { ...task, status: toCol, order: newOrder };
    const newFrom = localBoard[fromCol].filter(t => t.id !== taskId);
    let newTo = (fromCol === toCol ? newFrom : [...destCol]).filter(t => t.id !== taskId);
    if (insertBeforeId) {
      const idx = newTo.findIndex(t => t.id === insertBeforeId);
      newTo.splice(idx, 0, updatedTask);
    } else {
      newTo = [...newTo, updatedTask];
    }

    localBoard = {
      ...localBoard,
      [fromCol]: fromCol === toCol ? newTo : newFrom,
      [toCol]: newTo
    };
    if (selectedTask?.id === taskId) selectedTask = { ...selectedTask, status: toCol };

    setPending(taskId, true);
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PATCH', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ status: toCol, order: newOrder })
    });
    setPending(taskId, false);
  }

  // Save title inline
  async function saveTitle() {
    editingTitle = false;
    const val = editTitleVal.trim();
    if (!val || val === selectedTask.title) return;
    // Optimistic
    for (const col of Object.values(localBoard)) {
      const t = col.find(t => t.id === selectedTask.id);
      if (t) { t.title = val; break; }
    }
    localBoard = { ...localBoard };
    selectedTask = { ...selectedTask, title: val };
    await fetch(`/api/tasks/${selectedTask.id}`, {
      method: 'PATCH', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ title: val })
    });
  }

  // Save description inline
  async function saveDesc() {
    editingDesc = false;
    const val = editDescVal;
    if (val === (selectedTask.description ?? '')) return;
    selectedTask = { ...selectedTask, description: val };
    await fetch(`/api/tasks/${selectedTask.id}`, {
      method: 'PATCH', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ description: val })
    });
  }

  // Save due date
  async function saveDueDate(dateVal) {
    const due = dateVal || null;
    // Optimistic update on localBoard
    for (const col of Object.values(localBoard)) {
      const t = col.find(t => t.id === selectedTask.id);
      if (t) { t.due_date = due; break; }
    }
    localBoard = { ...localBoard };
    selectedTask = { ...selectedTask, due_date: due };
    await fetch(`/api/tasks/${selectedTask.id}`, {
      method: 'PATCH', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ dueDate: due ?? '' })
    });
  }

  // ── Drag & Drop handlers ─────────────────────────────────────
  function onDragStart(e, taskId, col) {
    dragTaskId = taskId;
    dragFromCol = col;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
  }

  function onColDragEnter(e, col) {
    e.preventDefault();
    dragEnterCounts = { ...dragEnterCounts, [col]: (dragEnterCounts[col] || 0) + 1 };
    dragOverCol = col;
  }

  function onColDragLeave(e, col) {
    const next = (dragEnterCounts[col] || 1) - 1;
    dragEnterCounts = { ...dragEnterCounts, [col]: next };
    if (next <= 0) {
      dragEnterCounts = { ...dragEnterCounts, [col]: 0 };
      if (dragOverCol === col) dragOverCol = null;
    }
  }

  function onDragOver(e, col, overTaskId = null) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dragOverCol = col;
    dragOverTaskId = overTaskId;
  }

  function onDrop(e, col, overTaskId = null) {
    e.preventDefault();
    if (!dragTaskId || !dragFromCol) return;
    const fromCol = dragFromCol;
    const taskId = dragTaskId;
    dragTaskId = null; dragFromCol = null; dragOverCol = null; dragOverTaskId = null;
    dragEnterCounts = {};
    moveTask(taskId, fromCol, col, overTaskId);
  }

  function onDragEnd() {
    dragTaskId = null; dragFromCol = null; dragOverCol = null; dragOverTaskId = null;
    dragEnterCounts = {};
  }

  // ── Realtime ─────────────────────────────────────────────────
  let realtimeChannel = null;

  onMount(() => {
    realtimeChannel = db
      .channel(`project-${project.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${project.id}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const id = payload.old.id;
            if (pendingTasks.has(id)) return;
            for (const col of columns) {
              localBoard[col] = (localBoard[col] || []).filter(t => t.id !== id);
            }
            localBoard = { ...localBoard };
            if (selectedTask?.id === id) selectedTask = null;
          } else {
            const t = payload.new;
            if (pendingTasks.has(t.id)) return;
            let found = false;
            let oldTask = null;
            for (const col of columns) {
              const idx = (localBoard[col] || []).findIndex(x => x.id === t.id);
              if (idx !== -1) {
                oldTask = localBoard[col][idx]; // save before filtering
                if (t.status !== col) {
                  localBoard[col] = localBoard[col].filter(x => x.id !== t.id);
                  localBoard[t.status] = [
                    ...(localBoard[t.status] || []),
                    { ...oldTask, ...t }
                  ];
                } else {
                  localBoard[col][idx] = { ...localBoard[col][idx], ...t };
                }
                found = true;
                break;
              }
            }
            if (!found && t.status) {
              localBoard[t.status] = [
                ...(localBoard[t.status] || []),
                { ...t, assignees: [], checklist: [], comments: [], reactions: [] }
              ];
            }
            localBoard = { ...localBoard };
          }
        }
      )
      .subscribe();
  });

  onDestroy(() => {
    if (realtimeChannel) db.removeChannel(realtimeChannel);
  });

  function stopProp(e) { e.stopPropagation(); }

  function openTask(task) {
    selectedTask = structuredClone($state.snapshot(task));
    editingTitle = false;
    editingDesc = false;
    editTitleVal = task.title;
    editDescVal = task.description ?? '';
  }
</script>

<svelte:window onclick={(e) => {
  if (!e.target.closest('.rzone')) showReactionPicker = null;
}} />

<svelte:head><title>{project.name} — Pinakas</title></svelte:head>

<div class="topbar">
  <div class="tl">
    <a href="/dashboard" class="back"><i class="ti ti-arrow-left"></i></a>
    <h2>{project.name}</h2>
    <span class="badge badge-{project.status === 'On track' ? 'green' : 'amber'}">{project.status ?? 'On track'}</span>
    {#if project.due_date}
      <span class="due-chip"><i class="ti ti-calendar"></i> Due {project.due_date}</span>
    {/if}
  </div>
  <div class="tr">
    <div class="member-stack">
      {#each allMembers.slice(0,4) as m, i}
        {@const s = avatarStyle(i)}
        <div class="avatar" style="width:28px;height:28px;font-size:10px;background:{s.bg};color:{s.c};border:2px solid var(--surface);margin-left:{i===0?0:-8}px;z-index:{10-i}" title={m.name}>
          {m.initials || m.name?.[0] || '?'}
        </div>
      {/each}
    </div>
    <a href="/dashboard/projects/{project.id}/settings" class="btn">
      <i class="ti ti-settings"></i> Settings
    </a>
    <button class="btn btn-primary" onclick={() => showAddTask = 'Backlog'}>
      <i class="ti ti-plus"></i> Add task
    </button>
  </div>
</div>

<div class="stats-bar">
  <div class="stat"><span class="stat-n">{totalTasks}</span><span class="stat-l">Total</span></div>
  <div class="stat"><span class="stat-n">{doneTasks}</span><span class="stat-l">Done</span></div>
  <div class="stat"><span class="stat-n">{inProgress}</span><span class="stat-l">In progress</span></div>
  <div class="stat"><span class="stat-n">{totalTasks ? Math.round((doneTasks/totalTasks)*100) : 0}%</span><span class="stat-l">Complete</span></div>
</div>

<div class="board-wrap">
  <div class="board" class:panel-open={!!selectedTask}>
    {#each columns as col}
      <div class="column"
        ondragenter={(e) => onColDragEnter(e, col)}
        ondragleave={(e) => onColDragLeave(e, col)}
        ondragover={(e) => onDragOver(e, col)}
        ondrop={(e) => onDrop(e, col)}
        class:drop-target={dragOverCol === col && dragOverTaskId === null}
      >
        <div class="col-header">
          <div class="col-title">
            <span class="col-dot" style="background:{colDots[col]}"></span>
            {col} <span class="col-count">{localBoard?.[col]?.length ?? 0}</span>
          </div>
          <button class="icon-add" onclick={() => showAddTask = col}>+</button>
        </div>

        {#each (localBoard?.[col] || []) as task}
          <div class="task-card"
            class:selected={selectedTask?.id === task.id}
            class:pending={pendingTasks.has(task.id)}
            class:dragging={dragTaskId === task.id}
            class:drop-before={dragOverTaskId === task.id}
            draggable="true"
            ondragstart={(e) => onDragStart(e, task.id, col)}
            ondragover={(e) => { e.stopPropagation(); onDragOver(e, col, task.id); }}
            ondrop={(e) => { e.stopPropagation(); onDrop(e, col, task.id); }}
            ondragend={onDragEnd}
            onclick={() => openTask(task)}
            onkeydown={(e) => e.key==='Enter' && openTask(task)}
            tabindex="0">

            {#if pendingTasks.has(task.id)}
              <span class="pending-ring" aria-label="Saving…"></span>
            {/if}

            {#if task.tag}<span class="task-tag">{task.tag}</span>{/if}
            <div class="task-title" class:done={col==='Done'}>{task.title}</div>

            {#if (task.reactions||[]).length > 0}
              <div class="card-reactions" role="group">
                {#each getReactionCounts(task.reactions) as r}
                  <span class="reaction-chip" class:reacted={hasUserReacted(task.reactions, r.emoji)}
                    onclick={(e) => { e.stopPropagation(); optimisticReaction(task.id, r.emoji); }}
                    role="button" tabindex="0">
                    {r.emoji} {r.count}
                  </span>
                {/each}
              </div>
            {/if}

            <div class="task-foot">
              <div class="assignees">
                {#each (task.assignees||[]).slice(0,3) as a, i}
                  {@const s = avatarStyle(i)}
                  <div class="avatar" style="width:18px;height:18px;font-size:8px;background:{s.bg};color:{s.c};margin-left:{i===0?0:-4}px">
                    {a.initials||a.name?.[0]||'?'}
                  </div>
                {/each}
              </div>
              <div class="task-actions" role="group">
                {#if col !== 'Done'}
                  <button class="icon-btn" title="Move right"
                    onclick={(e) => { e.stopPropagation(); const next = columns[columns.indexOf(col)+1]; if(next) moveTask(task.id, col, next); }}>
                    <i class="ti ti-chevron-right" style="font-size:11px"></i>
                  </button>
                {/if}
                <div class="rzone" style="position:relative">
                  <button class="icon-btn rzone" onclick={(e) => { e.stopPropagation(); showReactionPicker = showReactionPicker===task.id ? null : task.id; }}>✨</button>
                  {#if showReactionPicker === task.id}
                    <div class="reaction-picker rzone" role="dialog">
                      <div class="picker-title">Anime Moods</div>
                      <div class="picker-grid">
                        {#each ANIME_REACTIONS as r}
                          <button class="picker-btn rzone" class:active={hasUserReacted(task.reactions, r.emoji)}
                            onclick={() => optimisticReaction(task.id, r.emoji)} title={r.label}>
                            <span class="picker-emoji">{r.emoji}</span>
                            <span class="picker-label">{r.label}</span>
                          </button>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
                {#if task.due_date}
                  <span class="task-due"><i class="ti ti-calendar" style="font-size:10px"></i> {task.due_date}</span>
                {/if}
              </div>
            </div>
          </div>
        {/each}

        {#if showAddTask === col}
          <div class="quick-add">
            <input class="quick-input" type="text" bind:value={newTaskTitle}
              placeholder="Task title..." autofocus
              onkeydown={(e) => { if(e.key==='Enter') quickAddTask(col, newTaskTitle); if(e.key==='Escape') showAddTask=null; }} />
            <div class="quick-btns">
              <button class="btn btn-primary" style="font-size:12px;padding:4px 10px"
                onclick={() => quickAddTask(col, newTaskTitle)}>Add</button>
              <button class="btn" style="font-size:12px;padding:4px 10px"
                onclick={() => showAddTask = null}>Cancel</button>
            </div>
          </div>
        {:else}
          <button class="add-btn" onclick={() => showAddTask = col}>
            <i class="ti ti-plus"></i> Add task
          </button>
        {/if}
      </div>
    {/each}
  </div>

  {#if selectedTask}
    <div class="detail-panel">
      <div class="dp-header">
        <!-- Editable title -->
        {#if editingTitle}
          <input
            class="title-input"
            bind:value={editTitleVal}
            onblur={saveTitle}
            onkeydown={(e) => { if(e.key==='Enter') saveTitle(); if(e.key==='Escape') { editingTitle=false; editTitleVal=selectedTask.title; } }}
            autofocus
          />
        {:else}
          <span class="dp-title" onclick={() => { editingTitle=true; editTitleVal=selectedTask.title; }} title="Click to edit">{selectedTask.title}</span>
        {/if}
        <button class="close-btn" onclick={() => selectedTask = null}>&times;</button>
      </div>
      {#if selectedTask.tag}<span class="task-tag" style="display:inline-block;margin-bottom:12px">{selectedTask.tag}</span>{/if}

      <!-- Status — own fetch, no form submit collision -->
      <div class="dp-field">
        <div class="dp-label">Status</div>
        <select onchange={(e) => {
          const toCol = e.target.value;
          moveTask(selectedTask.id, selectedTask.status, toCol);
          selectedTask = { ...selectedTask, status: toCol };
        }}>
          {#each columns as col}
            <option value={col} selected={selectedTask.status === col}>{col}</option>
          {/each}
        </select>
      </div>

      <!-- Due date — own fetch, isolated -->
      <div class="dp-field">
        <div class="dp-label">Due date</div>
        <input type="date" value={selectedTask.due_date ?? ''}
          onchange={(e) => saveDueDate(e.target.value)} />
      </div>

      <!-- Editable description -->
      <div class="dp-field">
        <div class="dp-label">Description</div>
        {#if editingDesc}
          <textarea
            class="desc-textarea"
            bind:value={editDescVal}
            rows="4"
            onblur={saveDesc}
            onkeydown={(e) => { if(e.key==='Escape') { editingDesc=false; editDescVal=selectedTask.description??''; } }}
          ></textarea>
        {:else}
          <div
            class="dp-desc"
            class:dp-desc-empty={!selectedTask.description}
            onclick={() => { editingDesc=true; editDescVal=selectedTask.description??''; }}
            title="Click to edit"
          >
            {selectedTask.description || 'Add a description…'}
          </div>
        {/if}
      </div>

      {#if selectedTask.checklist?.length}
        <div class="dp-field">
          <div class="dp-label">Checklist ({selectedTask.checklist.filter(c=>c.done).length}/{selectedTask.checklist.length})</div>
          {#each selectedTask.checklist as item}
            <form method="POST" action="?/toggleChecklist" use:enhance style="display:contents">
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="done" value={(!item.done).toString()} />
              <label class="check-item" class:checked={item.done}>
                <input type="checkbox" checked={item.done} onchange={(e) => e.currentTarget.closest("form")?.requestSubmit()} />
                {item.text}
              </label>
            </form>
          {/each}
        </div>
      {/if}

      <!-- Reactions -->
      <div class="dp-field">
        <div class="dp-label">Anime Moods ✨</div>
        <div class="detail-reactions">
          {#each getReactionCounts(selectedTask.reactions) as r}
            <button class="reaction-chip" class:reacted={hasUserReacted(selectedTask.reactions, r.emoji)}
              onclick={() => optimisticReaction(selectedTask.id, r.emoji)}>
              {r.emoji} {r.count}
            </button>
          {/each}
          <div class="rzone" style="position:relative;display:inline-block">
            <button class="add-reaction-btn rzone"
              onclick={(e) => { e.stopPropagation(); showReactionPicker = showReactionPicker==='detail'?null:'detail'; }}>
              + mood
            </button>
            {#if showReactionPicker === 'detail'}
              <div class="reaction-picker rzone" style="bottom:auto;top:calc(100% + 6px);left:0;right:auto" role="dialog">
                <div class="picker-title">Choose a mood</div>
                <div class="picker-grid">
                  {#each ANIME_REACTIONS as r}
                    <button class="picker-btn rzone" class:active={hasUserReacted(selectedTask.reactions, r.emoji)}
                      onclick={() => optimisticReaction(selectedTask.id, r.emoji)} title={r.label}>
                      <span class="picker-emoji">{r.emoji}</span>
                      <span class="picker-label">{r.label}</span>
                    </button>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>

      <!-- Comments -->
      <div class="dp-field">
        <div class="dp-label">Comments ({selectedTask.comments?.length || 0})</div>
        {#each selectedTask.comments || [] as comment}
          <div class="comment">
            <div class="comment-author">{comment.author?.name || 'Unknown'}</div>
            <div class="comment-body">{comment.body}</div>
          </div>
        {/each}
        <form method="POST" action="?/addComment" use:enhance={() => ({ update }) => { update(); commentBody = ''; }}>
          <input type="hidden" name="taskId" value={selectedTask.id} />
          <textarea name="body" bind:value={commentBody} rows="2"
            placeholder="Write a comment..."></textarea>
          <button type="submit" class="btn" style="font-size:12px;margin-top:6px;padding:4px 10px">Post</button>
        </form>
      </div>

      <form method="POST" action="?/deleteTask"
        use:enhance={() => ({ update }) => { update(); selectedTask = null; }}
        style="margin-top:auto;padding-top:1rem;border-top:0.5px solid var(--border)">
        <input type="hidden" name="id" value={selectedTask.id} />
        <button type="submit" class="btn btn-danger" style="font-size:12px">
          <i class="ti ti-trash"></i> Delete task
        </button>
      </form>
    </div>
  {/if}
</div>

<style>
.topbar { display:flex; align-items:center; justify-content:space-between; padding:1rem 1.25rem; background:var(--surface); border-bottom:0.5px solid var(--border); }
.tl,.tr { display:flex; align-items:center; gap:10px; }
.back { color:var(--hint); font-size:18px; display:flex; align-items:center; }
.back:hover { color:var(--text); }
h2 { font-size:1rem; font-weight:600; margin:0; color:var(--text); }
.due-chip { font-size:12px; color:var(--muted); display:flex; align-items:center; gap:4px; }
.member-stack { display:flex; align-items:center; }
.avatar { border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:600; flex-shrink:0; }
.stats-bar { display:flex; border-bottom:0.5px solid var(--border); background:var(--surface); }
.stat { flex:1; padding:0.75rem 1.25rem; border-right:0.5px solid var(--border); display:flex; flex-direction:column; gap:2px; }
.stat:last-child { border-right:none; }
.stat-n { font-size:1.4rem; font-weight:600; color:var(--text); }
.stat-l { font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:0.05em; }
.board-wrap { display:flex; align-items:flex-start; flex:1; min-height:calc(100vh - 132px); overflow:hidden; }
.board { display:grid; grid-template-columns:repeat(4,305px); gap:12px; padding:1.25rem; align-items:start; flex-shrink:0; overflow-y:auto; max-height:calc(100vh - 132px); }
.board.panel-open { grid-template-columns:repeat(4,175px); }
.column { min-width:0; transition:background 0.15s; border-radius:10px; padding:4px; }
.column.drop-target { background:var(--bg); }
.col-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
.col-title { display:flex; align-items:center; gap:6px; font-size:12px; font-weight:500; color:var(--muted); }
.col-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.col-count { background:var(--bg); font-size:11px; padding:1px 6px; border-radius:10px; color:var(--hint); }
.icon-add { background:none; border:none; color:var(--hint); font-size:18px; line-height:1; cursor:pointer; }
.icon-add:hover { color:var(--text); }
.task-card { position:relative; width:100%; background:var(--surface); border:0.5px solid var(--border); border-radius:12px; padding:0.7rem; margin-bottom:8px; cursor:grab; text-align:left; transition:border-color 0.15s, opacity 0.15s, box-shadow 0.15s; }
.task-card:hover { border-color:var(--border-hover); }
.task-card.selected { border-color:var(--accent); border-width:1px; }
.task-card.dragging { opacity:0.4; cursor:grabbing; }
.task-card.drop-before { box-shadow:0 -3px 0 0 var(--accent); }
.task-card.pending { opacity:0.75; }

.pending-ring {
  position:absolute; top:8px; right:8px;
  width:10px; height:10px;
  border:1.5px solid var(--border);
  border-top-color:var(--accent);
  border-radius:50%;
  animation:spin 0.7s linear infinite;
}
@keyframes spin { to { transform:rotate(360deg); } }

.task-tag { font-size:10px; padding:2px 7px; border-radius:4px; background:var(--bg); color:var(--muted); font-weight:500; display:inline-block; margin-bottom:5px; }
.task-title { font-size:13px; font-weight:500; line-height:1.4; margin-bottom:6px; color:var(--text); }
.task-title.done { text-decoration:line-through; color:var(--hint); }
.task-foot { display:flex; align-items:center; justify-content:space-between; }
.assignees { display:flex; align-items:center; }
.task-due { font-size:11px; color:var(--hint); display:flex; align-items:center; gap:3px; }
.task-actions { display:flex; align-items:center; gap:4px; }
.icon-btn { background:none; border:none; cursor:pointer; font-size:13px; padding:2px 4px; border-radius:4px; line-height:1; color:var(--muted); }
.icon-btn:hover { background:var(--bg); color:var(--text); }
.card-reactions { display:flex; flex-wrap:wrap; gap:3px; margin-bottom:6px; }
.reaction-chip { display:inline-flex; align-items:center; gap:2px; font-size:11px; padding:2px 7px; border-radius:20px; background:var(--bg); border:0.5px solid var(--border); cursor:pointer; transition:all 0.12s; font-family:inherit; color:var(--text); }
.reaction-chip:hover { border-color:var(--accent); }
.reaction-chip.reacted { background:var(--accent-light); border-color:var(--accent); color:var(--accent-text); font-weight:600; }
.rzone { position:relative; }
.reaction-picker { position:absolute; bottom:calc(100% + 8px); right:0; background:var(--surface); border:0.5px solid var(--border); border-radius:14px; padding:0.75rem; box-shadow:0 8px 30px rgba(0,0,0,0.15); z-index:300; width:230px; }
.picker-title { font-size:10px; color:var(--hint); font-weight:500; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.06em; }
.picker-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:4px; }
.picker-btn { display:flex; flex-direction:column; align-items:center; gap:2px; background:none; border:0.5px solid transparent; border-radius:8px; padding:4px 2px; cursor:pointer; font-family:inherit; }
.picker-btn:hover { background:var(--bg); border-color:var(--border); }
.picker-btn.active { background:var(--accent-light); border-color:var(--accent); }
.picker-emoji { font-size:18px; line-height:1; }
.picker-label { font-size:8px; color:var(--hint); text-align:center; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:38px; }
.detail-reactions { display:flex; flex-wrap:wrap; gap:5px; align-items:center; }
.add-reaction-btn { background:none; border:0.5px dashed var(--border-hover); border-radius:20px; padding:3px 10px; font-size:11px; color:var(--hint); cursor:pointer; font-family:inherit; }
.add-reaction-btn:hover { border-color:var(--accent); color:var(--accent); }
.add-btn { width:100%; background:none; border:0.5px dashed var(--border); border-radius:8px; padding:6px; font-size:12px; color:var(--hint); cursor:pointer; display:flex; align-items:center; justify-content:center; gap:4px; font-family:inherit; }
.add-btn:hover { border-color:var(--border-hover); color:var(--muted); background:var(--bg); }
.quick-add { padding:8px; background:var(--bg); border-radius:10px; border:0.5px solid var(--border); }
.quick-input { width:100%; padding:6px 10px; border:0.5px solid var(--accent); border-radius:8px; font-size:13px; background:var(--surface); color:var(--text); outline:none; font-family:inherit; }
.quick-btns { display:flex; gap:6px; margin-top:6px; }
.detail-panel { width:285px; flex-shrink:0; background:var(--surface); border-left:0.5px solid var(--border); padding:1.25rem; display:flex; flex-direction:column; overflow-y:auto; max-height:calc(100vh - 132px); }
.dp-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:12px; gap:8px; }
.dp-title { font-size:14px; font-weight:500; line-height:1.4; flex:1; color:var(--text); cursor:text; border-radius:6px; padding:2px 4px; margin:-2px -4px; }
.dp-title:hover { background:var(--bg); }
.title-input { font-size:14px; font-weight:500; line-height:1.4; flex:1; color:var(--text); border:0.5px solid var(--accent); border-radius:6px; padding:2px 6px; background:var(--surface); font-family:inherit; outline:none; width:100%; }
.close-btn { background:none; border:none; font-size:20px; color:var(--hint); cursor:pointer; line-height:1; flex-shrink:0; }
.close-btn:hover { color:var(--text); }
.dp-field { margin-bottom:1rem; }
.dp-label { font-size:10px; color:var(--hint); text-transform:uppercase; letter-spacing:0.07em; font-weight:600; margin-bottom:5px; }
.dp-desc { font-size:12px; color:var(--muted); line-height:1.6; background:var(--bg); padding:8px 10px; border-radius:8px; cursor:text; min-height:36px; }
.dp-desc:hover { background:var(--border); }
.dp-desc-empty { color:var(--hint); font-style:italic; }
.desc-textarea { width:100%; font-size:12px; color:var(--text); line-height:1.6; background:var(--bg); padding:8px 10px; border-radius:8px; border:0.5px solid var(--accent); outline:none; font-family:inherit; resize:vertical; }
.check-item { display:flex; align-items:center; gap:8px; font-size:12px; color:var(--muted); padding:3px 0; cursor:pointer; }
.check-item.checked { text-decoration:line-through; color:var(--hint); }
.check-item input { accent-color:var(--accent); }
.comment { margin-bottom:8px; padding:8px 10px; background:var(--bg); border-radius:8px; }
.comment-author { font-size:11px; font-weight:600; color:var(--muted); margin-bottom:3px; }
.comment-body { font-size:12px; color:var(--text); line-height:1.5; }
textarea { resize:none; }
</style>
