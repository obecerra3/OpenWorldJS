//CMesh is short for corners mesh
//http://www.cs.cmu.edu/~alla/Rossignac.pdf
class CMesh
{
    mesh = new THREE.Mesh();
    geo_table = [];
    triangle_table = [];
    opposite_table = [];
    uvs = [];
    hard_vertices = [];
    hard_edges = [];

    clearTables()
    {
        this.geo_table = [];
        this.triangle_table = [];
        this.opposite_table = [];
        this.uvs = [];
    }

    createMesh(_material = null)
    {
        var geometry = new THREE.BufferGeometry();
        var vertices = new Float32Array(geo_table);
        geometry.setIndex(triangle_table);
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

        if (_material == null)
        {
            _material = new THREE.MeshBasicMaterial( { color: 0xAAFFAA } );
        }
        this.mesh = new THREE.Mesh(geometry, _material);
    }
}
