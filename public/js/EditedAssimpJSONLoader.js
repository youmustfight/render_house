/**
 * @author Alexander Gessler / http://www.greentoken.de/
 * https://github.com/acgessler
 *
 * Loader for models imported with Open Asset Import Library (http://assimp.sf.net)
 * through assimp2json (https://github.com/acgessler/assimp2json).
 *
 * Supports any input format that assimp supports, including 3ds, obj, dae, blend,
 * fbx, x, ms3d, lwo (and many more).
 *
 * See webgl_loader_assimp2json example.
 */

THREE.AssimpJSONLoader = function ( manager ) {
	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

};

THREE.AssimpJSONLoader.prototype = {

	constructor: THREE.AssimpJSONLoader,

	texturePath : '',

	load: function ( url, onLoad, onProgress, onError, texturePath ) {

		var scope = this;
		this.texturePath = texturePath && ( typeof texturePath === "string" ) ? texturePath : this.extractUrlBase( url );

		var loader = new THREE.XHRLoader( this.manager );
		loader.setCrossOrigin( this.crossOrigin );
		loader.load( url, function ( text ) {
			var json = JSON.parse( text ), scene, metadata;

			// Check __metadata__ meta header if present
			// This header is used to disambiguate between
			// different JSON-based file formats.
			metadata = json.__metadata__;
			if ( typeof metadata !== 'undefined' )
			{
				// Check if assimp2json at all
				if ( metadata.format !== 'assimp2json' ) {
					onError('Not an assimp2json scene');
					return;
				}
				// Check major format version
				else if ( metadata.version < 100 && metadata.version >= 200 ) {
					onError('Unsupported assimp2json file format version');
					return;
				}
			}

			scene = scope.parse( json );
			onLoad( scene );
		}, onProgress, onError );
	},

	setCrossOrigin: function ( value ) {
		this.crossOrigin = value;
	},

	extractUrlBase: function ( url ) { // from three/src/loaders/Loader.js
		var parts = url.split( '/' );
		parts.pop();
		// Parts gives back the models/ folder for paths
		// console.log(parts);
		return ( parts.length < 1 ? '.' : parts.join( '/' ) ) + '/';
	},

	parse: function ( json ) {
		var meshes = this.parseList ( json.meshes, this.parseMesh );
		var materials = this.parseList ( json.materials, this.parseMaterial );
		return this.parseObject( json, json.rootnode, meshes, materials );
	},

	parseList : function(json, handler) {
		var meshes = new Array(json.length);
		for (var i = 0; i < json.length; ++ i) {
			meshes[i] = handler.call(this, json[i]);
		}
		// console.log(meshes);
		return meshes;
	},

	parseMesh : function(json) {
		var vertex, geometry, i, e, in_data, src;


		geometry = new THREE.Geometry();

		// read vertex positions
		for (in_data = json.vertices, i = 0, e = in_data.length; i < e; ) {
			geometry.vertices.push( new THREE.Vector3( in_data[ i ++ ], in_data[ i ++ ], in_data[ i ++ ] ) );
		}

		// read faces
		var cnt = 0;
		for (in_data = json.faces, i = 0, e = in_data.length; i < e; ++ i) {
			face = new THREE.Face3();
			src = in_data[i];
			face.a = src[0];
			face.b = src[1];
			face.c = src[2];

			face.materialIndex = 0; //json.materialindex;
			geometry.faces.push(face);
		}

		// read texture coordinates - three.js attaches them to its faces
		json.texturecoords = json.texturecoords || [];
		for (i = 0, e = json.texturecoords.length; i < e; ++ i) {

			function convertTextureCoords(in_uv, out_faces, out_vertex_uvs) {
				var i, e, face, a, b, c;

				for (i = 0, e = out_faces.length; i < e; ++ i) {
					face = out_faces[i];
					a = face.a * 2;
					b = face.b * 2;
					c = face.c * 2;
					out_vertex_uvs.push([
						new THREE.Vector2( in_uv[ a ], in_uv[ a + 1 ] ),
						new THREE.Vector2( in_uv[ b ], in_uv[ b + 1 ] ),
						new THREE.Vector2( in_uv[ c ], in_uv[ c + 1 ] )
					]);
				}
			}

			convertTextureCoords(json.texturecoords[i], geometry.faces, geometry.faceVertexUvs[i]);
		}

		// read normals - three.js also attaches them to its faces
		if (json.normals) {

			function convertNormals(in_nor, out_faces) {
				var i, e, face, a, b, c;

				for (i = 0, e = out_faces.length; i < e; ++ i) {
					face = out_faces[i];
					a = face.a * 3;
					b = face.b * 3;
					c = face.c * 3;
					face.vertexNormals = [
						new THREE.Vector3( in_nor[ a ], in_nor[ a + 1 ], in_nor[ a + 2 ] ),
						new THREE.Vector3( in_nor[ b ], in_nor[ b + 1 ], in_nor[ b + 2 ] ),
						new THREE.Vector3( in_nor[ c ], in_nor[ c + 1 ], in_nor[ c + 2 ] )
					];
				}
			}

			convertNormals(json.normals, geometry.faces);
		}

		// read vertex colors - three.js also attaches them to its faces
		if (json.colors && json.colors[0]) {

			function convertColors(in_color, out_faces) {
				var i, e, face, a, b, c;

				function makeColor(start) {
					var col = new THREE.Color( );
					col.setRGB( arr[0], arr[1], arr[2] );
					// TODO: what about alpha?
					return col;
				}

				for (i = 0, e = out_faces.length; i < e; ++ i) {
					face = out_faces[i];
					a = face.a * 4;
					b = face.b * 4;
					c = face.c * 4;
					face.vertexColors = [
						makeColor( a ),
						makeColor( b ),
						makeColor( c )
					];
				}
			}

			convertColors(json.colors[0], geometry.faces);
		}

		//geometry.computeFaceNormals();
		//geometry.computeVertexNormals();
		//geometry.computeTangents();
		geometry.computeBoundingSphere();

		// TODO: tangents
		return geometry;
	},

	parseMaterial : function(json) {
		// console.log('Obj: ',json);
		// Original mat value is null --- why does this matter :((((
		// var mat = {},
		var mat = {}, 
			scope = this, 
			i, 
			prop, 
			has_textures = [],

		init_props = {
			shading : THREE.SmoothShading
		};

		function toColor(value_arr) {
			var col = new THREE.Color();
			col.setRGB(value_arr[0], value_arr[1], value_arr[2]);
			return col;
		}

		function defaultTexture() {
			var im = new Image();
			im.width = 1;
			im.height = 1;
			return new THREE.Texture(im);
		}

		for (var i in json.properties) {
			prop = json.properties[i];
			// console.log('Props key: ', prop.key, prop.semantic);
			if (prop.key === '$tex.file') {
				// prop.semantic gives the type of the texture
				// 1: diffuse
				// 2: specular mao
				// 5: height map (bumps)
				// 6: normal map
				// more values (i.e. emissive, environment) are known by assimp and may be relevant
				if (prop.semantic === 1 || prop.semantic === 5 || prop.semantic === 6 || prop.semantic === 2) {
					// console.log(scope);
					// console.log(scope.texturePath);
					// var material_url,
					// 	tex;
					(function(semantic) {
						var loader = new THREE.TextureLoader(scope.manager),
						keyname;

						if (semantic === 1) {
							keyname = 'map';
						}
						else if (semantic === 5) {
							keyname = 'bumpMap';
						}
						else if (semantic === 6) {
							keyname = 'normalMap';
						}
						else if (semantic === 2) {
							keyname = 'specularMap';
						}

						has_textures.push(keyname);

						loader.setCrossOrigin(this.crossOrigin);
						material_url = scope.texturePath + '/' + prop.value
						material_url = material_url.replace(/\\/g, '/');
						//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! 
						// I think it's this material_url that's not lining up
						loader.load(material_url, function(tex) {
							if (tex) {
								// TODO: read texture settings from assimp.
								// Wrapping is the default, though.
								tex.wrapS = tex.wrapT = THREE.RepeatWrapping;

								mat[keyname] = tex;
								mat.needsUpdate = true;
							}
						});
					})(prop.semantic);
					//!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! 
					// Mat is an {} at first, but when switching back to previously loaded models, it gains the property needsUpdate: true, along with a map: THREE.Texture
					// But then wtf does it work with in the other version when mat is null?!?! Why does rendering a new obj not have an issues? 
					// I think it is that our problem arises when we load the 3rd item - and that has to do with previous
					// Think it has something to do with the second time an object is rendered. Don't think I'm removing it properly
					// console.log('mat: ',mat)

					// console.log(material_url);	
					// console.log('tex: ',tex);	
				}
			}
			else if (prop.key === '?mat.name') {
				init_props.name = prop.value;
			}
			else if (prop.key === '$clr.diffuse') {
				init_props.color = toColor(prop.value);
			}
			else if (prop.key === '$clr.specular') {
				init_props.specular = toColor(prop.value);
			}
			else if (prop.key === '$clr.emissive') {
				init_props.emissive = toColor(prop.value);
			}
			else if (prop.key === '$mat.shadingm') {
				// aiShadingMode_Flat
				if (prop.value === 1) {
					init_props.shading = THREE.FlatShading;
				}
			}
			else if (prop.key === '$mat.shininess') {
				init_props.shininess = prop.value;
			}
		}

		// note: three.js does not like it when a texture is added after the geometry
		// has been rendered once, see http://stackoverflow.com/questions/16531759/.
		// for this reason we fill all slots upfront with default textures
		if (has_textures.length) {
			// console.log('has_textures: ', has_textures);
			for (i = has_textures.length - 1; i >= 0; -- i) {
				init_props[has_textures[i]] = defaultTexture();
			}
		}
		console.log('init_props: ', init_props);
		// mat is the __proto__ of our objects? No, mat is being returned tho by the parseMaterial function (being called by parse)
		mat = new THREE.MeshPhongMaterial( init_props );
		// Mat
		console.log("Mat", mat);
		return mat;
	},

	parseObject : function(json, node, meshes, materials) {

		var obj = new THREE.Object3D()
		,	i
		,	idx
		;

		obj.name = node.name || "";
		obj.matrix = new THREE.Matrix4().fromArray(node.transformation).transpose();
		obj.matrix.decompose( obj.position, obj.quaternion, obj.scale );

		for (i = 0; node.meshes && i < node.meshes.length; ++ i) {
			idx = node.meshes[i];
			obj.add(new THREE.Mesh( meshes[idx], materials[json.meshes[idx].materialindex] ));
		}

		for (i = 0; node.children && i < node.children.length; ++ i) {
			obj.add(this.parseObject(json, node.children[i], meshes, materials));
		}

		return obj;
	},
};


