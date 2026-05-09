<script>
  let { rows } = $props()
</script>

<div class="table-wrap">
  <table>
    <thead>
      <tr>
        {#each rows[0] ?? [] as cell, index (index)}
          <th>{cell}</th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each rows.slice(1) as row, rowIndex (rowIndex)}
        <tr>
          {#each row as cell, cellIndex (cellIndex)}
            <td>{cell}</td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>
