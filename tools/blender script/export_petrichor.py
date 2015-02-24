# Copyright © 2014 Florent 'flure' CURE <florent.cure@gmail.com>
# This work is free. You can redistribute it and/or modify it under the
# terms of the Do What The Fuck You Want To Public License, Version 2,
# as published by Sam Hocevar. See http://www.wtfpl.net/ for more details.

#### ##     ## ########   #######  ########  ########  ######
 ##  ###   ### ##     ## ##     ## ##     ##    ##    ##    ##
 ##  #### #### ##     ## ##     ## ##     ##    ##    ##
 ##  ## ### ## ########  ##     ## ########     ##     ######
 ##  ##     ## ##        ##     ## ##   ##      ##          ##
 ##  ##     ## ##        ##     ## ##    ##     ##    ##    ##
#### ##     ## ##         #######  ##     ##    ##     ######

import bpy
import bpy.props
from bpy_extras.io_utils import ExportHelper
import json
import bmesh

import time

########  ##       ######## ##    ## ########  ######## ########        ###    ########  ########   #######  ##    ##    #### ##    ## ########  #######
##     ## ##       ##       ###   ## ##     ## ##       ##     ##      ## ##   ##     ## ##     ## ##     ## ###   ##     ##  ###   ## ##       ##     ##
##     ## ##       ##       ####  ## ##     ## ##       ##     ##     ##   ##  ##     ## ##     ## ##     ## ####  ##     ##  ####  ## ##       ##     ##
########  ##       ######   ## ## ## ##     ## ######   ########     ##     ## ##     ## ##     ## ##     ## ## ## ##     ##  ## ## ## ######   ##     ##
##     ## ##       ##       ##  #### ##     ## ##       ##   ##      ######### ##     ## ##     ## ##     ## ##  ####     ##  ##  #### ##       ##     ##
##     ## ##       ##       ##   ### ##     ## ##       ##    ##     ##     ## ##     ## ##     ## ##     ## ##   ###     ##  ##   ### ##       ##     ##
########  ######## ######## ##    ## ########  ######## ##     ##    ##     ## ########  ########   #######  ##    ##    #### ##    ## ##        #######

bl_info = {
	"name": "Export scene to JSON for the Petrichor JS/WebGL Engine",
	"author": "Florent CURE (flure)",
	"category": "Import-Export",
	"location": "File > Import-Export"
}

      ##  ######   #######  ##    ##     #######  ########        ##  ######
      ## ##    ## ##     ## ###   ##    ##     ## ##     ##       ## ##    ##
      ## ##       ##     ## ####  ##    ##     ## ##     ##       ## ##
      ##  ######  ##     ## ## ## ##    ##     ## ########        ##  ######
##    ##       ## ##     ## ##  ####    ##     ## ##     ## ##    ##       ##
##    ## ##    ## ##     ## ##   ###    ##     ## ##     ## ##    ## ##    ##
 ######   ######   #######  ##    ##     #######  ########   ######   ######
# ------------------------------------------------------------------------------
class JsonTransform(object):
	""" Holds a transformation for an object """
	def __init__(self):
		self.translation = (0.0, 0.0, 0.0)
		self.rotation = (0.0, 0.0, 0.0)
		self.scale = (1.0, 1.0, 1.0)
# ------------------------------------------------------------------------------

# ------------------------------------------------------------------------------
class JsonObject(object):
	""" Base class for exported objects """
	def __init__(self):
		self.name = ""
		self.transform = JsonTransform()
		self.object_type = ''
# ------------------------------------------------------------------------------

# ------------------------------------------------------------------------------
class JsonMesh(JsonObject):
	""" Holds the representation of a mesh for JSON export """
	def __init__(self):
		super().__init__()
		self.object_type = 'MESH'
		self.vertices = []
		self.normals = []
		self.uv = []
		self.texture = ""
		self.ambiant = 0.0
		self.diffuse = (1.0, 1.0, 1.0)
		self.specular = (0.0, 0.0, 0.0)
		self.hardness = 0
		self.indices = []
# ------------------------------------------------------------------------------

# ------------------------------------------------------------------------------
class JsonLight(JsonObject):
	""" Holds the representation of a light for JSON export """
	def __init__(self):
		super().__init__()
		self.object_type = 'LIGHT'
		self.type = "POINT"
		self.radius = 30.0
		self.color = (1.0, 1.0, 1.0)
# ------------------------------------------------------------------------------

# ------------------------------------------------------------------------------
class JsonScene(object):
	""" Holds the representation of a scene for JSON export """
	def __init__(self):
		self.name = ""
		self.lights = []
		self.meshes = []
# ------------------------------------------------------------------------------

 ######   #######  ##    ## ##     ## ######## ########  ######## ######## ########   ######
##    ## ##     ## ###   ## ##     ## ##       ##     ##    ##    ##       ##     ## ##    ##
##       ##     ## ####  ## ##     ## ##       ##     ##    ##    ##       ##     ## ##
##       ##     ## ## ## ## ##     ## ######   ########     ##    ######   ########   ######
##       ##     ## ##  ####  ##   ##  ##       ##   ##      ##    ##       ##   ##         ##
##    ## ##     ## ##   ###   ## ##   ##       ##    ##     ##    ##       ##    ##  ##    ##
 ######   #######  ##    ##    ###    ######## ##     ##    ##    ######## ##     ##  ######

# ------------------------------------------------------------------------------
class JsonBaseConverter(object):
	""" Base class for Json converters. """

	def __init__(self, rounding):
		self.rounding = rounding

	def _get_transform(self, obj, json_obj):
		rot = obj.rotation_euler
		loc = obj.location
		sca = obj.scale

		# swapping coordinates for opengl
		json_obj.transform.translation = (round(loc.x, self.rounding),
			round(loc.z, self.rounding), round(-loc.y, self.rounding))
		json_obj.transform.rotation = (round(rot.x, self.rounding),
			round(rot.z, self.rounding), round(rot.y, self.rounding))
		json_obj.transform.scale = (round(sca.x, self.rounding),
			round(sca.z, self.rounding), round(sca.y, self.rounding))

	def convert(self, obj):
		if obj.type == 'MESH':
			json_obj = JsonMesh()
		elif obj.type == 'LAMP':
			json_obj = JsonLight()

		self._get_transform(obj, json_obj)
		json_obj.name = obj.name
		return json_obj
# ------------------------------------------------------------------------------

# ------------------------------------------------------------------------------
class JsonMeshConverter(JsonBaseConverter):
	""" Used to convert a Blender mesh to a JsonMesh object. """
	def __init__(self, rounding):
		super().__init__(rounding)

	def _get_geometry(self, obj, json_obj):
		bme = bmesh.new()
		bme.from_mesh(obj.data)
		bmesh.ops.triangulate(bme, faces=bme.faces)
		uv_layer = None

		if len(bme.loops.layers.uv) > 0:
			uv_layer = bme.loops.layers.uv[0]

		for face in bme.faces:
			for loop in face.loops:
				# swapping coordinates for opengl
				json_obj.vertices.append(loop.vert.co[0])
				json_obj.vertices.append(loop.vert.co[2])
				json_obj.vertices.append(-loop.vert.co[1])

				# swapping coordinates for opengl
				json_obj.normals.append(loop.vert.normal[0])
				json_obj.normals.append(loop.vert.normal[2])
				json_obj.normals.append(-loop.vert.normal[1])

				if uv_layer != None:
					json_obj.uv.append(loop[uv_layer].uv[0])
					json_obj.uv.append(loop[uv_layer].uv[1])

	def _get_material(self, obj, json_obj):
		material = obj.active_material

		if material is not None:
			json_obj.ambiant = material.ambient
			json_obj.diffuse = [round(material.diffuse_color.r, self.rounding),
						   round(material.diffuse_color.g, self.rounding),
						   round(material.diffuse_color.b, self.rounding)]
			json_obj.specular = [round(material.specular_color.r, self.rounding),
						   round(material.specular_color.g, self.rounding),
						   round(material.specular_color.b, self.rounding)]
			json_obj.hardness = round(material.specular_hardness, self.rounding)

			# only one texture per mesh for the moment
			texpath = ""
			tex_list = obj.data.uv_textures
			if len(tex_list) > 0:
				if len(tex_list[0].data) > 0:
					texpath = tex_list[0].data[0].image.filepath

			if texpath != "":
				split_texpath = texpath.split("\\")
				json_obj.texture = split_texpath[-1:][0]

	def _get_vertex(self, vertices, i):
		idx = i*3
		if idx < len(vertices):
			return (vertices[idx], vertices[idx+1], vertices[idx+2])
		else:
			return (0, 0, 0)

	def _get_normal(self, normals, i):
		idx = i*3
		if idx < len(normals):
			return (normals[idx], normals[idx+1], normals[idx+2])
		else:
			return (0, 0, 0)

	def _get_tex_coord(self, uv, i):
		idx = i*2
		if idx < len(uv):
			return (uv[idx], uv[idx+1])
		else:
			return (0, 0)

	def _index_vertices(self, json_obj):
		verts = [];
		index = [];
		verts_unique = []
		hashes = []
		index = []

		start = time.clock()
		# Dédoublonnage des vertices
		for i in range(0, len(json_obj.vertices) // 3):
			vertex = (self._get_vertex(json_obj.vertices, i),
					  self._get_normal(json_obj.normals, i),
					  self._get_tex_coord(json_obj.uv, i))
			verts.append(vertex)

		elapsed = time.clock() - start
		print('liste des vertices ' + str(elapsed))

		start = time.clock()
		verts_unique = sorted(list(set(verts)))
		hashes_unique = [hash(v) for v in verts_unique]
		elapsed = time.clock() - start
		print('conversion en set sorted ' + str(elapsed))

		start = time.clock()
		index = [hashes_unique.index(hash(vertex)) for vertex in verts]
		elapsed = time.clock() - start
		print('construction de l\'index ' + str(elapsed))

		vertices = []
		normals = []
		uv = []
		for v in verts_unique:
			vertices.extend(v[0])
			normals.extend(v[1])
			uv.extend(v[2])

		# Arrondi a 4 decimales pour reduire la taille du JSON
		tmp = vertices
		vertices = [round(v, self.rounding) for v in tmp]
		tmp = normals
		normals = [round(n, self.rounding) for n in tmp]
		tmp = uv
		uv = [round(t, self.rounding) for t in tmp]

		json_obj.vertices = vertices
		json_obj.normals = normals
		json_obj.uv = uv
		json_obj.indices = index


	def convert(self, obj):
		json_obj = super().convert(obj)

		bme = bmesh.new()
		bme.from_mesh(obj.data)

		bmesh.ops.triangulate(bme, faces=bme.faces)

		if len(bme.loops.layers.uv) > 0:
			uv_layer = bme.loops.layers.uv[0]

		self._get_geometry(obj, json_obj)

		# only one material per mesh for the moment
		self._get_material(obj, json_obj)

		self._index_vertices(json_obj)

		return json_obj
# ------------------------------------------------------------------------------

# ------------------------------------------------------------------------------
class JsonLightConverter(JsonBaseConverter):
	""" Used to convert a Blender light into a JsonLight object. """
	def __init__(self, rounding):
		super().__init__(rounding)

	def convert(self, obj):
		json_obj = super().convert(obj)

		json_obj.type = obj.data.type
		json_obj.radius = round(obj.data.distance, self.rounding)
		json_obj.color = (round(obj.data.color.r, self.rounding),
						  round(obj.data.color.g, self.rounding),
						  round(obj.data.color.b, self.rounding))

		return json_obj
# ------------------------------------------------------------------------------

# ------------------------------------------------------------------------------
class JsonObjectConverter(object):
	""" Used to export a Blender object, using the adequate exporter """
	def __init__(self, rounding):
		self.rounding = rounding
		self.mesh_converter = JsonMeshConverter(self.rounding)
		self.light_converter = JsonLightConverter(self.rounding)

	def to_json(obj):
		return obj.__dict__

	def convert(self, obj):
		if obj.type == 'MESH':
			start = time.clock()
			json_obj = self.mesh_converter.convert(obj)
			elapsed = time.clock() - start
			print('temps total ' + str(elapsed))
		elif obj.type == 'LAMP':
			json_obj = self.light_converter.convert(obj)
		else:
			return None

		json_obj.name = obj.name
		return json_obj
# ------------------------------------------------------------------------------

######## ##     ## ########   #######  ########  ######## ######## ########
##        ##   ##  ##     ## ##     ## ##     ##    ##    ##       ##     ##
##         ## ##   ##     ## ##     ## ##     ##    ##    ##       ##     ##
######      ###    ########  ##     ## ########     ##    ######   ########
##         ## ##   ##        ##     ## ##   ##      ##    ##       ##   ##
##        ##   ##  ##        ##     ## ##    ##     ##    ##       ##    ##
######## ##     ## ##         #######  ##     ##    ##    ######## ##     ##

# ------------------------------------------------------------------------------
class JsonSceneExporter(object):
	""" Used to export the scene or only the selected objects. """
	def __init__(self, fp, rounding=4, only_selected=False, only_first_selected=False):
		self.fp = fp
		self.rounding = 4
		self.only_selected = only_selected
		self.only_first_selected = only_first_selected

	def export(self, context):
		converter = JsonObjectConverter(self.rounding)
		to_export = None

		objs_to_export = []
		scene = context.scene

		if self.only_first_selected:
			if len(context.selected_objects) > 0:
				to_export = converter.convert(context.selected_objects[0])
		else:
			to_export = JsonScene()
			if self.only_selected:
				objs_to_export = context.selected_objects
			else:
				objs_to_export = scene.objects

			print(objs_to_export)

			for obj in objs_to_export:
				o = converter.convert(obj)
				if isinstance(o, JsonLight):
					to_export.lights.append(o)
				elif isinstance(o, JsonMesh):
					to_export.meshes.append(o)

		json.dump(to_export.__dict__, self.fp, default=JsonObjectConverter.to_json,
			indent=None, ensure_ascii=True, separators=(',', ':'))

# ------------------------------------------------------------------------------

##     ## ####
##     ##  ##
##     ##  ##
##     ##  ##
##     ##  ##
##     ##  ##
 #######  ####

# ------------------------------------------------------------------------------
class PetrichorExporter(bpy.types.Operator, ExportHelper):
	""" Used to export the current scene to a JSON file """
	bl_idname = 'export_petrichor.json'
	bl_label = 'Export'
	bl_description = 'Export scene to Petrichor'

	filename_ext = '.json'
	filter_glob = bpy.props.StringProperty(default="*.json", options={'HIDDEN'})

	only_first_selected = bpy.props.BoolProperty(name="Export only the first selected object",
		description="Used to export only one object with no scene information.",
		default=True)

	only_selected = bpy.props.BoolProperty(name="Export only selected objects",
		description="Used to export only selected objects instead of the whole scene.",
		default=False)

	rounding = bpy.props.IntProperty(name="Decimal float rounding",
		description="Used to round float values in order to save space in exported file.",
		default=4, min=0, max=20, subtype='UNSIGNED')

	def execute(self, context):
		fp = open(self.filepath, 'w')
		exporter = None
		exporter = JsonSceneExporter(fp, rounding=self.rounding,
				only_selected=self.only_selected, only_first_selected=self.only_first_selected)
		exporter.export(context)
		fp.close()
		return {'FINISHED'}
# ------------------------------------------------------------------------------

########  ########  ######   ####  ######  ######## ########     ###    ######## ####  #######  ##    ##
##     ## ##       ##    ##   ##  ##    ##    ##    ##     ##   ## ##      ##     ##  ##     ## ###   ##
##     ## ##       ##         ##  ##          ##    ##     ##  ##   ##     ##     ##  ##     ## ####  ##
########  ######   ##   ####  ##   ######     ##    ########  ##     ##    ##     ##  ##     ## ## ## ##
##   ##   ##       ##    ##   ##        ##    ##    ##   ##   #########    ##     ##  ##     ## ##  ####
##    ##  ##       ##    ##   ##  ##    ##    ##    ##    ##  ##     ##    ##     ##  ##     ## ##   ###
##     ## ########  ######   ####  ######     ##    ##     ## ##     ##    ##    ####  #######  ##    ##

def menu_func_export(self, context):
    self.layout.operator(PetrichorExporter.bl_idname, text="Export to Petrichor (.json)")

def register():
	bpy.utils.register_module(__name__);
	bpy.types.INFO_MT_file_export.append(menu_func_export)

def unregister():
	bpy.utils.unregister_module(__name__)
	bpy.types.INFO_MT_file_export.remove(menu_func_export)


if __name__ == "__main__":
    register()
