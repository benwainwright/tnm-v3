const obj = this.assigned_group;
// refined collection
const result = Object.values(
  obj.reduce((c, v) => {
    c[v] = c[v] || [v, 0];
    c[v][1]++;
    return c;
  }, {})
).map((o) => ({ [o[0]]: o[1] }));

this.assigned_group_delta = result.map((a) => {
  this.x = a;
});
console.log(this.x);

//output give last item only in object
