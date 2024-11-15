from setuptools import setup

setup(
    name="sunsnake",
    version="0.1.0",
    py_modules=["sunsnaker", "compile", ],  # List the top-level modules
    install_requires=['py-mini-racer', ],                 # Add dependencies if needed
    description="Run sunsnake through Python. sunsnaker: Decorate a Python function to compile and run it in V8/JavaScript.",
    author="Petter Amland",
    author_email="pokepetter@gmail.com",
)
