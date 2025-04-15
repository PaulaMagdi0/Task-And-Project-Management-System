{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  # Required system libraries
  buildInputs = [
    pkgs.python3
    pkgs.zlib
    pkgs.stdenv.cc.cc.lib
    pkgs.libffi
  ];

  # Set environment variables so Python can find the libraries
  LD_LIBRARY_PATH = "${pkgs.stdenv.cc.cc.lib}/lib:${pkgs.zlib}/lib";

  shellHook = ''
    # # Create fresh virtual environment
    # python -m venv venv
    source venv/bin/activate

    # Install numpy with specific build flags
    # pip install --no-cache-dir --no-build-isolation numpy==1.26.4 pandas
  '';
}