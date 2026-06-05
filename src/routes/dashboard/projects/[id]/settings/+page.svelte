<script>
  import { enhance } from '$app/forms';
  let { data, form } = $props();
  let { project, invites, user } = $derived(data);

  let inviteEmail = $state('');
  let generatedLink = $state(form?.inviteUrl ?? '');
  let copied = $state(false);
  let selectedColor = $state(project.color);
  let savingProject = $state(false);
  let sendingInvite = $state(false);
  let removingMember = $state(null);

  const colorOptions = ['#639922','#378ADD','#D4537E','#EF9F27','#534AB7','#1D9E75','#D85A30'];
  const statusOptions = ['On track','At risk','Off track','Complete'];

  $effect(() => { if (form?.inviteUrl) generatedLink = form.inviteUrl; });

  async function copyLink() {
    await navigator.clipboard.writeText(generatedLink);
    copied = true;
    setTimeout(() => copied = false, 2000);
  }

  function avatarStyle(i) {
    const p = [{bg:'#EAF3DE',c:'#27500A'},{bg:'#E6F1FB',c:'#0C447C'},{bg:'#FBEAF0',c:'#72243E'},{bg:'#FAEEDA',c:'#633806'},{bg:'#EEEDFE',c:'#3C3489'}];
    return p[i % p.length];
  }
</script>

<svelte:head><title>{project.name} — Settings</title></svelte:head>

<div class="page">
  <div class="page-header">
    <a href="/dashboard/projects/{project.id}" class="back">
      <i class="ti ti-arrow-left"></i> Back to {project.name}
    </a>
    <h1>Project Settings</h1>
  </div>

  <div class="sections">
    <!-- General -->
    <div class="section">
      <div class="section-title">General</div>
      <form method="POST" action="?/updateProject" use:enhance={() => { savingProject = true; return ({ update }) => { savingProject = false; update(); }; }} class="form-grid">
        <div class="form-group">
          <label for="name">Project name</label>
          <input id="name" name="name" value={project.name} required />
        </div>
        <div class="form-group">
          <label for="status">Status</label>
          <select id="status" name="status">
            {#each statusOptions as s}
              <option value={s} selected={project.status === s}>{s}</option>
            {/each}
          </select>
        </div>
        <div class="form-group">
          <label for="dueDate">Due date</label>
          <input type="date" id="dueDate" name="dueDate"
            value={project.due_date ? new Date(project.due_date).toISOString().split('T')[0] : ''} />
        </div>
        <div class="form-group full">
          <label>Project color</label>
          <div class="color-row">
            {#each colorOptions as color}
              <button type="button" class="color-btn" class:selected={selectedColor === color}
                style="background:{color}" onclick={() => selectedColor = color}></button>
            {/each}
          </div>
          <input type="hidden" name="color" value={selectedColor} />
        </div>
        <div class="form-group full">
          <button type="submit" class="btn btn-primary" disabled={savingProject}>
            {#if savingProject}<span class="btn-spinner"></span>{/if}
            {savingProject ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>

    <!-- Invite -->
    <div class="section">
      <div class="section-title">Invite members</div>
      <p class="section-desc">Generate an invite link to share with teammates. Links expire after 7 days.</p>
      <form method="POST" action="?/invite" use:enhance={() => { sendingInvite = true; return ({ update }) => { sendingInvite = false; update(); }; }} class="invite-form">
        <input type="email" name="email" bind:value={inviteEmail}
          placeholder="teammate@example.com" required />
        <button type="submit" class="btn btn-primary" disabled={sendingInvite}>
          {#if sendingInvite}<span class="btn-spinner"></span>{/if}
          {sendingInvite ? 'Generating...' : 'Generate link'}
        </button>
      </form>

      {#if generatedLink}
        <div class="invite-result">
          <i class="ti ti-link" style="color:var(--accent);flex-shrink:0"></i>
          <span class="invite-url">{generatedLink}</span>
          <button class="copy-btn" class:copied onclick={copyLink}>
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
        <p class="invite-hint">Share this link with {inviteEmail || 'your teammate'}. It expires in 7 days.</p>
      {/if}

      <!-- Recent invites -->
      {#if invites.length > 0}
        <div class="invite-list">
          <div class="invite-list-label">Recent invites</div>
          {#each invites as inv}
            <div class="invite-row" class:used={inv.used_at} class:expired={!inv.used_at && new Date(inv.expires_at) < new Date()}>
              <i class="ti ti-mail" style="color:var(--hint)"></i>
              <span class="inv-email">{inv.email}</span>
              <span class="inv-status">
                {#if inv.used_at}✓ Accepted{:else if new Date(inv.expires_at) < new Date()}Expired{:else}Pending{/if}
              </span>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Members -->
    <div class="section">
      <div class="section-title">Members ({project.project_members.length + 1})</div>
      <div class="member-list">
        <!-- Owner -->
        <div class="member-row">
          <div class="avatar" style="background:#EAF3DE;color:#27500A">{user?.initials ?? '?'}</div>
          <div class="member-info">
            <div class="member-name">{user?.name}</div>
            <div class="member-email">{user?.email}</div>
          </div>
          <span class="role-badge owner">Owner</span>
        </div>
        {#each project.project_members as m, i}
          {@const s = avatarStyle(i + 1)}
          <div class="member-row">
            <div class="avatar" style="background:{m.users.color??s.bg};color:{m.users.text_color??s.c}">
              {m.users.initials ?? m.users.name?.[0] ?? '?'}
            </div>
            <div class="member-info">
              <div class="member-name">{m.users.name}</div>
              <div class="member-email">{m.users.email}</div>
            </div>
            <span class="role-badge">{m.role}</span>
            <form method="POST" action="?/removeMember" use:enhance={() => { removingMember = m.users.id; return ({ update }) => { removingMember = null; update(); }; }}>
              <input type="hidden" name="userId" value={m.users.id} />
              <button type="submit" class="remove-btn" title="Remove member" disabled={removingMember === m.users.id}>
                {#if removingMember === m.users.id}
                  <span class="remove-spinner"></span>
                {:else}
                  <i class="ti ti-x"></i>
                {/if}
              </button>
            </form>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
.page { padding:1.5rem; max-width:640px; }
.page-header { margin-bottom:1.5rem; }
.back { font-size:13px; color:var(--muted); display:inline-flex; align-items:center; gap:4px; margin-bottom:0.5rem; }
.back:hover { color:var(--text); }
h1 { font-size:1.2rem; font-weight:700; color:var(--text); margin:0; }
.sections { display:flex; flex-direction:column; gap:1.5rem; }
.section { background:var(--surface); border:0.5px solid var(--border); border-radius:12px; padding:1.25rem 1.5rem; }
.section-title { font-size:13px; font-weight:600; color:var(--text); margin-bottom:1rem; }
.section-desc { font-size:12px; color:var(--muted); margin-bottom:1rem; }
.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
.form-group { display:flex; flex-direction:column; gap:4px; }
.form-group.full { grid-column:1/-1; }
label { font-size:12px; font-weight:500; color:var(--muted); }
input, select { padding:7px 10px; border:0.5px solid var(--border-hover); border-radius:8px; font-size:13px; font-family:inherit; background:var(--surface); color:var(--text); outline:none; }
input:focus, select:focus { border-color:var(--accent); }
.color-row { display:flex; gap:8px; flex-wrap:wrap; }
.color-btn { width:26px; height:26px; border-radius:50%; border:2.5px solid transparent; cursor:pointer; transition:transform 0.1s; }
.color-btn:hover { transform:scale(1.1); }
.color-btn.selected { border-color:var(--text); }
.invite-form { display:flex; gap:8px; }
.invite-form input { flex:1; }
.invite-result { display:flex; align-items:center; gap:8px; background:var(--bg); border:0.5px solid var(--border); border-radius:8px; padding:8px 12px; margin-top:0.75rem; }
.invite-url { flex:1; font-size:12px; color:var(--muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-family:monospace; }
.copy-btn { background:var(--accent-light); color:var(--accent-text); border:none; border-radius:6px; padding:4px 10px; font-size:12px; cursor:pointer; font-family:inherit; white-space:nowrap; font-weight:500; }
.copy-btn.copied { background:var(--accent); color:#fff; }
.invite-hint { font-size:11px; color:var(--hint); margin-top:6px; }
.invite-list { margin-top:1rem; border-top:0.5px solid var(--border); padding-top:0.75rem; display:flex; flex-direction:column; gap:6px; }
.invite-list-label { font-size:10px; color:var(--hint); text-transform:uppercase; letter-spacing:0.07em; margin-bottom:4px; font-weight:600; }
.invite-row { display:flex; align-items:center; gap:8px; font-size:12px; padding:4px 0; }
.inv-email { flex:1; color:var(--text); }
.inv-status { font-size:11px; padding:2px 8px; border-radius:20px; background:var(--bg); color:var(--hint); }
.invite-row.used .inv-status { background:var(--accent-light); color:var(--accent-text); }
.invite-row.expired .inv-status { color:var(--hint); }
.member-list { display:flex; flex-direction:column; gap:8px; }
.member-row { display:flex; align-items:center; gap:10px; }
.avatar { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:600; flex-shrink:0; }
.member-info { flex:1; min-width:0; }
.member-name { font-size:13px; font-weight:500; color:var(--text); }
.member-email { font-size:11px; color:var(--muted); }
.role-badge { font-size:11px; padding:2px 8px; border-radius:20px; background:var(--bg); color:var(--muted); flex-shrink:0; }
.role-badge.owner { background:var(--accent-light); color:var(--accent-text); }
.remove-btn { background:none; border:none; color:var(--hint); cursor:pointer; font-size:14px; padding:4px; border-radius:6px; display:flex; align-items:center; }
.remove-btn:hover { background:var(--red-light); color:var(--red); }
.btn-spinner { display:inline-block; width:11px; height:11px; border:1.5px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; vertical-align:middle; margin-right:4px; }
.remove-spinner { display:inline-block; width:11px; height:11px; border:1.5px solid var(--border-hover); border-top-color:var(--muted); border-radius:50%; animation:spin 0.7s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>