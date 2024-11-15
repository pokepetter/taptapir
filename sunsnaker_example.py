from sunsnaker import sunsnaker
from ursina.array_tools import Array2D as Array_2d


@sunsnaker      # remove this to run in python mode
def grid_to_cubes(grid, grid_size):
    def volume(e):
        return e[0] * e[1] * e[2]

    def Vec3_zero():
        return [0,0,0]

    def create_shapes(size):
        size_x = size[0]
        size_y = size[1]
        size_z = size[2]
        sizes = [Vec3_zero for i in range(size_x*size_y*size_z)]
        i = 0
        for x in range(size_x):
            for y in range(size_y):
                for z in range(size_z):
                    sizes[i] = [x+1,y+1,z+1]
                    i += 1

        # sizes.sort(key=volume, reverse=True)
        return sizes

    def shape_fits_in_grid(grid, start_position, shape, filled):
        w = shape[0]
        h = shape[1]
        d = shape[2]
        for x in range(w):
            for y in range(h):
                for z in range(d):
                    # print('a')
                    if filled[x+start_position[0]][y+start_position[1]][z+start_position[2]]:
                        return False
                    if not grid[start_position[0]+x][start_position[1]+y][start_position[2]+z]:
                        return False
        return True

    grid_size_x = grid_size[0]
    grid_size_y = grid_size[1]
    grid_size_z = grid_size[2]
    shapes = create_shapes(grid_size)
    # filled = [[[0 for z in range(grid_d)]for y in range(grid_h)] for x in range(grid_w)]
    # filled = [0 for i in range(grid_size_x * grid_size_y * grid_size_z)]
    filled = [Array_2d(grid_size_z, grid_size_y) for x in range(grid_size_x)]
    for x in range(grid_size_x):
        for y in range(grid_size_y):
            for z in range(grid_size_z):
                filled[x][y][z] = 0

    cubes = []

    # find number of blocks so we can exit early when alle have been found
    num_solid_blocks = 0
    for x in range(grid_size_x):
        for y in range(grid_size_y):
            for z in range(grid_size_z):
                if grid[x][y][z]:
                    num_solid_blocks += 1


    for shape in shapes:
        w = shape[0]
        h = shape[1]
        d = shape[2]
        # print('a--------------', w,h,d)
        # check at each position
        for x in range(grid_size_x - w + 1):
            for y in range(grid_size_y - h + 1):
                for z in range(grid_size_z - d + 1):
                    # print(x,y,z)
                    if filled[x][y][z]:
                        continue
                    # print('check position', Vec3(x,y,z))
                    if shape_fits_in_grid(grid, [x,y,z], shape, filled):
                        # print('create cube:', shape)
                        # Entity(model='cube', origin=(-.5,-.5,-.5), position=Vec3(x,y,z), scale=shape, texture='brick')
                        cubes.append(([x,y,z], shape))
                        # cubes.append('YAY')

                        for _x in range(w):
                            for _y in range(h):
                                for _z in range(d):
                                    # filled.append(Vec3(int(x+_x),int(y+_y),int(z+_z)))
                                    filled[x+_x][y+_y][z+_z] = 1
                                    num_solid_blocks -= 1


                        if num_solid_blocks == 0:
                            # print('EXIT EARLY')
                            return cubes

    return cubes


# return ctx.call("grid_to_cubes", voxels)

# 0.0076396000004024245
# 0.003643000000010943
# 0.003947799999878043
# 0.007242600000608945
# 0.004123800001252675
# 0.0036384000013640616

if __name__ == '__main__':
    from ursina import *
    from time import perf_counter
    app = Ursina(window_type='none')
    
    size = 16
    grid = [[[0 for z in range(size)]for y in range(size)] for x in range(size)]
    for x in range(size):
        for z in range(size):
            grid[x][0][z] = 1

    for x in range(2,5):
        for z in range(2,5):
            for y in range(1,4):
                grid[x][y][z] = 1


    # t = perf_counter()
    # cubes = grid_to_cubes(grid, (size,size,size))
    # print('--------', perf_counter() - t)
    # print(cubes)
    # t = perf_counter()
    # result = ctx.call("grid_to_cubes", grid)
    # print('-----------finished in:', perf_counter() - t)
    def test():
        t = perf_counter()
        cubes = grid_to_cubes(grid, (size,size,size))
        print('--------', perf_counter() - t)

    Sequence(test, .5, loop=True, started=True)
    app.run()