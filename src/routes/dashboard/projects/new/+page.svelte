<script>
  import { enhance } from '$app/forms';
  let { form } = $props();
  const colorOptions = ['#639922','#378ADD','#D4537E','#EF9F27','#534AB7','#1D9E75','#D85A30'];
  let selectedColor = $state('#639922');
  let submitting = $state(false);
</script>

<svelte:head><title>New project — Pinakas</title></svelte:head>

<div class="wrap">
  <div class="header">
    <a href="/dashboard" class="back"><i class="ti ti-arrow-left" aria-hidden="true"></i> Back</a>
    <h1>Create project</h1>
  </div>

  <div class="card form-card">
    <form method="POST" use:enhance={() => { submitting = true; return ({ update }) => { submitting = false; update(); }; }}>
      {#if form?.error}
        <div class="error-box">{form.error}</div>
      {/if}

      <div class="form-group">
        <label for="name">Project name *</label>
        <input type="text" id="name" name="name" placeholder="e.g. Mobile App v2" required />
      </div>

      <div class="form-group">
        <label for="description">Description</label>
        <textarea id="description" name="description" rows="3" placeholder="What is this project about?"></textarea>
      </div>

      <div class="form-group">
        <label>Project color</label>
        <div class="color-row">
          {#each colorOptions as color}
            <button type="button" class="color-btn" class:selected={selectedColor === color}
              style="background:{color}" onclick={() => selectedColor = color}
              aria-label="Select color {color}"></button>
          {/each}
        </div>
        <input type="hidden" name="color" value={selectedColor} />
      </div>

      <div class="form-group">
        <label for="dueDate">Due date</label>
        <input type="date" id="dueDate" name="dueDate" />
      </div>

      <div class="actions">
        <a href="/dashboard" class="btn">Cancel</a>
        <button type="submit" class="btn btn-primary" disabled={submitting}>
          {#if submitting}<span class="btn-spinner"></span>{/if}
          {submitting ? 'Creating...' : 'Create project'}
        </button>
      </div>
    </form>
  </div>
</div>

<style>
.wrap { max-width: 560px; margin: 0 auto; padding: 2rem 1.5rem; }
.header { margin-bottom: 1.5rem; }
.back { font-size: 13px; color: var(--muted); display: inline-flex; align-items: center; gap: 4px; margin-bottom: 0.75rem; }
.back:hover { color: var(--text); }
h1 { font-family: var(--font-display); font-size: 1.3rem; font-weight: 700; }
.form-card { padding: 1.5rem 2rem; }
.error-box { background: var(--red-light); color: var(--red); padding: 8px 12px; border-radius: var(--radius-md); font-size: 13px; margin-bottom: 1rem; }
.color-row { display: flex; gap: 8px; flex-wrap: wrap; }
.color-btn { width: 28px; height: 28px; border-radius: 50%; border: 2.5px solid transparent; cursor: pointer; transition: transform 0.1s; }
.color-btn:hover { transform: scale(1.1); }
.color-btn.selected { border-color: var(--text); }
.actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 1.5rem; }
.btn-spinner { display:inline-block; width:11px; height:11px; border:1.5px solid rgba(255,255,255,0.4); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; vertical-align:middle; margin-right:4px; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
